# PizzaMaker — Project Guide

**Read this first if you're trying to understand the app.** It's the "what is where, and
what does what" document. `README.md` tells you how to run it; `ARCHITECTURE.md` is the
formal design write-up; this one is the tour.

It is kept up to date as the project changes.
Last updated: the Kafka + Kubernetes work (see [Part 6](#part-6--the-kafka-pipeline)).

---

## Part 0 — The fastest way to understand this app

Don't read the code file by file. You'll drown: there are ~100 Java classes and most of
them are boring. Instead, **follow one order through the system, end to end.** Every
interesting decision in this codebase is on that path.

Do it in this order. It's about 30 minutes.

| # | Read this | And you'll understand |
|---|---|---|
| 1 | [`OrderRequest.java`](../backend/src/main/java/com/pizzamaker/dto/request/OrderRequest.java) | What a customer actually sends |
| 2 | [`OrderController.java`](../backend/src/main/java/com/pizzamaker/controller/OrderController.java) | The five endpoints that exist |
| 3 | [`OrderService.placeOrder`](../backend/src/main/java/com/pizzamaker/service/OrderService.java) | The heart of the app — read this twice |
| 4 | [`OutboxRelay.java`](../backend/src/main/java/com/pizzamaker/outbox/OutboxRelay.java) | How work escapes the request thread |
| 5 | [`OrderLifecycleListener.java`](../backend/src/main/java/com/pizzamaker/messaging/OrderLifecycleListener.java) | How the pizza "cooks" itself |
| 6 | [`useOrderUpdates.js`](../src/hooks/useOrderUpdates.js) | How the browser hears about it |

That's the spine. Everything else — auth, pricing, analytics, payments — hangs off it.

---

## Part 1 — What the app is

A customer builds a pizza (size, crust, bake level, sauce, six cheeses, toppings with
Light/Regular/Extra tiers), sees the price update live, places the order, and then watches
its status change in real time without refreshing the page.

There's also an **admin** who can see all orders and move one forward manually, and an
analytics surface (revenue over time, topping popularity, status funnel).

### The one diagram

```
   BROWSER                          SPRING BOOT                          DATA
┌──────────────┐
│ React + Vite │──── POST /api/v1/orders ───┐
│ Redux Toolkit│                            │
└──────────────┘                            ▼
        ▲                        ┌──────────────────────┐
        │                        │ OrderService         │   ONE TRANSACTION
        │                        │   .placeOrder()      │──────────────────┐
        │                        └──────────────────────┘                  │
        │                                                          ┌───────▼────────┐
        │                                                          │  orders        │
        │                                                          │  order_line_.. │
        │                                                          │  order_status..│
        │                                                          │  outbox_event  │ ← the trick
        │                                                          └───────┬────────┘
        │                                                                  │
        │                        ┌──────────────────────┐                  │
        │                        │ OutboxRelay          │ ◄────────────────┘
        │                        │  (polls every 2s)    │      claims PENDING rows
        │                        └──────────┬───────────┘
        │                                   │ publishes
        │                                   ▼
        │                        ┌──────────────────────┐
        │                        │       KAFKA          │
        │                        │  orders.placed       │
        │                        │  orders.lifecycle    │
        │                        │  orders.status-changed│
        │                        └──────────┬───────────┘
        │                                   │ consumes
        │                                   ▼
        │                        ┌──────────────────────┐
        │                        │ OrderLifecycleListener│  PENDING → CONFIRMED
        │                        │  (the "kitchen")      │  → PREPARING → READY
        │                        └──────────┬───────────┘
        │                                   │ each change loops back
        │                                   │ through the outbox
        │                        ┌──────────▼───────────┐
        └──── STOMP push ────────│ OrderStatusBroadcast │
           /user/queue/orders    │        Listener      │
                                 └──────────────────────┘
```

**If you only remember one thing:** the database write and the "an event happened" record
are *the same transaction*. Everything else is a consequence of that.

---

## Part 2 — What each technology actually does for you

Not "what is Kafka" — what does it do *in this app*, and what breaks if you remove it.

| Technology | Its job here | What breaks without it |
|---|---|---|
| **Spring Boot** | Wires everything together; you write classes, it constructs them | Nothing works |
| **Spring Data JPA / Hibernate** | Turns `Order` objects into SQL rows | You'd hand-write every query |
| **Flyway** | Versioned schema changes (`V1__…` → `V21__…`), applied in order on boot | New deploys hit a schema they don't recognise |
| **H2 / PostgreSQL** | H2 in dev (in-memory, resets on restart), Postgres in prod | — |
| **Spring Security + JWT** | Every request carries a signed token; no server-side session | Anyone could order as anyone |
| **Bucket4j** | Rate-limits the auth endpoints | Brute-force login is free |
| **WebSocket / STOMP / SockJS** | The server *pushes* status changes; the browser doesn't poll | The UI would need to poll every few seconds |
| **Transactional Outbox** | Makes "order saved" and "event emitted" atomic | See Part 4 — this is the important one |
| **Kafka** | A durable, replayable log between "order placed" and the work it triggers | The kitchen pipeline; no fan-out to future consumers |
| **Resilience4j** | Retries + circuit-breaks the notification call | One flaky downstream stalls things |
| **Micrometer / Actuator** | `/actuator/health` for K8s probes, `/actuator/prometheus` for metrics | K8s can't tell if a pod is alive |
| **Lombok** | Generates getters/builders so entities aren't 300 lines | Lots of typing |
| **Testcontainers** | Runs the integration test against a *real* Postgres | H2-only tests miss Postgres-specific bugs |
| **Docker / docker-compose** | One command brings up Postgres + Kafka + the app | Manual setup of three services |
| **Kubernetes / Helm** | Runs multiple replicas with health probes and config/secrets split out | No multi-replica story |

---

## Part 3 — Following one order, in detail

### Step 1 — The request arrives

`POST /api/v1/orders`, with `Authorization: Bearer <jwt>` and optionally an
`Idempotency-Key` header.

`JwtAuthenticationFilter` validates the token and puts the user in the SecurityContext, so
`OrderController` can take `@AuthenticationPrincipal UserDetails user` and know who's
ordering. **The client never tells us who it is in the body** — that would be trivially
forgeable.

### Step 2 — `OrderService.placeOrder()` — one transaction, four writes

This whole method is `@Transactional`: all of it commits, or none of it does.

1. **Idempotency check.** If the client sent an `Idempotency-Key` we've seen before, return
   the *original* order instead of making a second one. A user double-clicking "Order"
   should not buy two pizzas. The real guarantee is a unique DB index — the lookup is just
   the fast path.
2. **Validate the toppings.** `sanitizeToppings()` checks every topping id against the
   active catalog. A tampered request asking for `"free_caviar"` is rejected, not silently
   accepted.
3. **Price it server-side.** `PricingService.computeTotal()`. The client sends a price too —
   we ignore it. Never trust a client-supplied price.
4. **Save the order** (status `PENDING`), **the line-item receipt snapshot** (so an old
   receipt survives future price changes), and **a status-history row**.
5. **Append an `ORDER_PLACED` row to `outbox_event`.** ← *this is the interesting one*

### Step 3 — Why the outbox exists (the core idea)

The obvious way to do step 5 would be to just... send the event:

```java
orderRepository.save(order);
kafkaTemplate.send("orders.placed", event);   // ❌ don't do this
```

This is broken, and it's broken in a way that only shows up under load, at 3am. It's called
the **dual-write problem**: two systems, no shared transaction.

- Kafka send succeeds → DB commit fails → **the kitchen starts cooking an order that doesn't
  exist.**
- DB commit succeeds → Kafka send fails → **the customer is charged and nothing ever
  happens.**

You cannot fix this with a try/catch, because the process can die *between* the two lines.

The **transactional outbox** sidesteps it entirely. We don't write to two systems — we write
to *one*:

```java
orderRepository.save(order);       // table: orders
outboxService.append(event);       // table: outbox_event   ← same transaction!
```

Both rows commit together, or neither does. A separate process then reads `outbox_event`
and publishes to Kafka. The event is now guaranteed to exist *if and only if* the order
does.

### Step 4 — `OutboxRelay` drains the outbox

A `@Scheduled` job, every 2 seconds:

1. Claims a batch of `PENDING` rows — with `SELECT … FOR UPDATE **SKIP LOCKED**`, so when
   several pods run at once each grabs a *different* batch instead of queueing behind each
   other.
2. Hands each to `OutboxDispatcher` → `KafkaOrderEventPublisher` → Kafka.
3. Marks the row `PROCESSED`. **Only after Kafka acknowledges the write** — the publisher
   deliberately blocks on the ack. If the broker is down, the send throws, the row stays
   `PENDING`, and it's retried with exponential backoff. The event is *never silently lost*.
4. After 5 failed attempts, the row is marked `FAILED` for a human to look at.

### Step 5 — Kafka, and the self-cooking pizza

`OrderLifecycleListener` consumes `orders.placed` and starts the pipeline. It advances the
order one stage, then **publishes the next stage back onto Kafka as a new message**:

```
orders.placed  →  [advance to CONFIRMED]  →  orders.lifecycle
orders.lifecycle → [advance to PREPARING] →  orders.lifecycle
orders.lifecycle → [advance to READY]     →  (done)
```

**Why not just `Thread.sleep(3000)` between stages?** Because a Kafka listener runs on a
consumer thread that's also responsible for calling `poll()`. Sleep in it and you stall
every partition assigned to that consumer; sleep past `max.poll.interval.ms` and Kafka
concludes the consumer is dead, evicts it, and rebalances the whole group. A 3-second nap
becomes a cluster-wide stutter. So the delay happens on a `TaskScheduler` thread instead,
and the listener returns immediately.

Each stage change goes back through `OrderService` → outbox → Kafka → the broadcast
listener → the customer's browser.

### Step 6 — The push to the browser

`OrderStatusBroadcastListener` consumes `orders.status-changed` and calls
`convertAndSendToUser(email, "/queue/orders", …)`, which STOMP routes to that one customer's
subscription. `useOrderUpdates.js` receives it and updates the status badge. No refresh, no
polling.

---

## Part 4 — The three guarantees, and how each is bought

These are the things an interviewer will push on. Each is bought with a specific mechanism.

### "The event can't disagree with the database"
**Bought with:** the transactional outbox. One transaction, one system. See Step 3.

### "The same order can't be cooked twice"
**Bought with:** `OrderStatus.canTransitionTo()`.

Kafka is **at-least-once**: if a consumer does the work and then dies before committing its
offset, the message comes back. So handlers must be safe to run twice.

`advanceStatusIfPossible()` re-reads the order and checks the transition is still legal.
On a redelivery the order is *already* `CONFIRMED`, and `CONFIRMED → CONFIRMED` isn't a
legal move — so it logs and skips. Not an error. **The guard doing its job is what makes
at-least-once delivery safe.**

The same guard handles the admin racing the pipeline: if an admin moves the order forward
first, the pipeline's next hop is a no-op. The admin wins.

### "The customer sees PREPARING before READY, never the reverse"
**Bought with:** the message key.

```java
kafkaTemplate.send(topic, orderId, event);
//                        ^^^^^^^ this
```

Kafka only guarantees ordering **within a partition**. The key is hashed to choose the
partition — so keying by order id puts all of one order's events on one partition, in
order. Unkeyed, they'd round-robin across partitions, be consumed in parallel, and the
customer could see `READY` before `PREPARING`.

---

## Part 5 — The map of the codebase

```
backend/src/main/java/com/pizzamaker/
│
├── controller/     The HTTP surface. Thin — they just delegate.
├── dto/            The wire format. Records. request/ in, response/ out.
│                   Entities are NEVER returned directly (that leaks your schema).
├── entity/         The JPA classes = the tables.
│                   ★ OrderStatus.java — the state machine. Small file, big consequences.
├── repository/     Spring Data interfaces. You declare a method name; Spring writes the SQL.
├── service/        ★ Where the actual business logic lives.
│                   OrderService, PricingService, AuthService, AnalyticsService
├── outbox/         ★ OutboxService (write) / OutboxRelay (drain) / OutboxDispatcher (route)
├── messaging/      ★ Everything Kafka. All of it @ConditionalOnProperty(app.kafka.enabled).
├── event/          The event payloads. Plain records that go on the wire.
├── security/       JWT filter, token provider, STOMP auth, rate limiting.
├── config/         Spring wiring. WebSocketConfig is the interesting one.
├── mapper/         entity → DTO. Static methods, no magic.
└── payment/        Pluggable provider + HMAC-verified webhook.

src/                 ← the React frontend (project root, not under backend/)
├── hooks/useOrderUpdates.js   ★ the STOMP subscription
├── store/                     Redux Toolkit slices
├── containers/                the pages
└── components/                the UI
```

The ★ files are the ones worth actually reading.

### Where to look when…

| You want to change… | Go to |
|---|---|
| What a pizza costs | `PricingService` |
| What toppings exist | the `topping` table + `CatalogService` |
| The order lifecycle | `OrderStatus` (the transition table) |
| What the customer sees pushed | `OrderStatusUpdateResponse` + `useOrderUpdates.js` |
| Who can call what | `SecurityConfig` + `@PreAuthorize` on controllers |
| The schema | a **new** `V22__*.sql` — never edit an applied migration |

---

## Part 6 — The Kafka pipeline

Everything Kafka lives in `messaging/` and is gated behind one flag:

```yaml
app.kafka.enabled: false   # the default
```

**With the flag off** (the default — plain `./mvnw spring-boot:run`, and the whole test
suite): no broker needed. The outbox relay dispatches in-process via
`InProcessOrderEventPublisher`, exactly as the app worked before Kafka existed. Orders don't
auto-advance; an admin moves them. *This is a supported mode, not a broken one.*

**With the flag on** (`docker compose up`, Kubernetes): the full pipeline runs.

### The topics

| Topic | Who writes | Who reads |
|---|---|---|
| `orders.placed` | the outbox relay | `OrderLifecycleListener` — sends confirmation, starts the pipeline |
| `orders.lifecycle` | `OrderLifecycleListener` (itself!) | `OrderLifecycleListener` — one hop per message |
| `orders.status-changed` | the outbox relay | `OrderStatusBroadcastListener` — pushes to the browser |
| `*.DLT` | the error handler | a human |

### Retries and the dead-letter topic

`DefaultErrorHandler` retries with exponential backoff — **but not for everything.** Some
failures will never succeed no matter how many times you try:

- a malformed payload
- an order id that doesn't exist
- an illegal state transition

Retrying those is pure waste, and worse, it *pins the partition* — nothing behind the poison
message gets processed. So they're classified as non-retryable and go **straight** to
`<topic>.DLT`. Only genuinely transient failures (broker blip, DB timeout) burn the retry
budget.

### The two consumer groups, and why

This is the subtlest design decision in the project.

**Work listeners** (`orders.placed`, `orders.lifecycle`) share **one** consumer group. They
are *competing consumers*: each message must be handled exactly once, by one pod. You do not
want three pods each cooking the same pizza.

**The broadcast listener** (`orders.status-changed`) gets a **unique group per pod** — a
fresh UUID on every JVM start. That's a deliberate inversion, and here's why:

`WebSocketConfig` uses `enableSimpleBroker()` — an **in-memory** STOMP broker, living inside
one JVM. A pod can only push to WebSocket sessions *it is personally holding*.

So with a shared group and 2 replicas: Kafka hands the status change to **one** pod. That
pod is, usually, **not** the one holding the customer's socket. `convertAndSendToUser()`
finds nobody, drops the message silently, and the customer's tracker never updates. It would
work perfectly at 1 replica and break the instant you scale — the worst kind of bug.

Giving every pod its own group turns competing-consumer into **broadcast**: all pods see
every status change, each pushes to whatever sessions it holds, the rest no-op.

> **The proper at-scale fix** is `enableStompBrokerRelay()` backed by RabbitMQ/ActiveMQ,
> which makes the STOMP broker shared infrastructure so any pod can reach any session. It is
> deliberately *not* built here — it means running a second broker next to Kafka to serve a
> demo. That's a conscious trade-off, and it's the right thing to say out loud rather than
> pretend the current design scales infinitely.

---

## Part 7 — Running it

Three modes, in increasing order of realism.

```bash
# 1. Simplest — H2, no broker, no Docker. Orders don't auto-advance.
cd backend && ./mvnw spring-boot:run
npm run dev

# 2. Full stack — Postgres + Kafka + the app. Orders cook themselves.
docker compose up --build

# 3. Kubernetes — 2 replicas, the real multi-pod behaviour.
minikube start --memory=4096 --cpus=4      # Kafka WILL be OOMKilled at the default 2GB
cd backend && docker build -t pizzamaker-api:local .
minikube image load pizzamaker-api:local
kubectl apply -f k8s/deps/            # Postgres + Kafka
helm install pizzamaker ./helm/pizzamaker
minikube service pizzamaker-pizzamaker --url
```

See `README.md` for the full version of each.

---

## Part 8 — Gotchas that will bite you

| Symptom | Cause |
|---|---|
| Live site "takes forever" to sign in / place an order | Render free-tier **cold start** (sleeps after ~15 min idle, 30–60s to wake). NOT the code — warm, it's <1s. Softened by the keep-warm cron (`.github/workflows/keep-warm.yml`) and the "Firing up the oven" overlay (`src/shared/WarmupOverlay`). |
| Order history / receipt shows "Plain" for a loaded pizza | Was a real bug: the old formatter filtered `value === true`, catching cheese booleans but never the `toppings` array. Fixed via `orderIngredientLabels()` in `fromOrder.js` — use it, don't reinvent it. |
| App boots fine but consumes nothing | A listener bean missing `@Lazy(false)`. `spring.main.lazy-initialization=true` is set globally, so a lazy bean is never instantiated, so its `@KafkaListener` is never registered. Silent. |
| Kafka pod `CrashLoopBackOff`, `OOMKilled` | minikube's default 2GB. Kafka needs ~1GB to itself. `--memory=4096`. |
| Pod stuck in `ImagePullBackOff` | `imagePullPolicy` isn't `Never`. The image was side-loaded, not pushed to a registry. |
| Status pushes vanish at `replicas: 2` | The broadcast listener lost its per-pod group id. See Part 6. |
| Customer gets a burst of stale toasts on restart | The broadcast consumer is on `earliest`. A brand-new group id + `earliest` = replay the entire topic. It must be `latest`. |
| Flyway checksum error | Someone edited an already-applied migration. Never do that; add a new one. |
| `helm upgrade` changes config but nothing happens | Env vars are read once at container start. The pod template needs a config checksum annotation to force a roll — it has one; don't remove it. |

---

## Part 9 — Where the bodies are buried

Honest list of known limitations. Better to know them than to discover them in an
interview.

1. **The stage delay isn't durable.** The next lifecycle hop is scheduled on an in-memory
   `TaskScheduler`. If the pod dies during those 3 seconds, that hop is lost and the order
   stops advancing (an admin can still push it). Making it durable means a delay topic or a
   DB-backed job.
2. **`enableSimpleBroker()` doesn't scale.** Handled with the per-pod consumer group, but
   the real answer is an external STOMP broker. See Part 6.
3. **Unique consumer groups accumulate.** Every pod restart leaves a dead group behind.
   Kafka reaps them after `offsets.retention.minutes` (7 days), so it's bounded, but it's
   litter.
4. **Kafka off = no auto-advance.** Intentional, and documented, but worth saying: the two
   modes don't behave identically.
5. **The K8s manifests and Helm chart are unverified.** They were written without a cluster
   available to apply them to.
