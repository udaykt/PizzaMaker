# Interview Notes — the Kafka + WebSocket design in PizzaMaker

Eight questions a product-company interviewer will actually ask about *this* design, and
answers that hold up under follow-up.

The meta-advice: every one of these has a naive answer that sounds fine and a real answer
that shows you've thought about failure. Interviewers are probing for the second. **Lead
with the failure mode, then the mechanism that closes it.**

---

## 1. You publish to Kafka on order placement. Walk me through what happens if the broker is down at that moment.

**Nothing is lost, and the customer's order still succeeds.** That's the whole point of the
design.

`placeOrder()` never talks to Kafka. It writes the order row *and* an `outbox_event` row in
one transaction and returns. The customer gets their confirmation whether Kafka is up,
down, or on fire — the broker is not on the critical path of taking money.

A separate `OutboxRelay` polls the outbox every 2 seconds and publishes. If the broker is
down, the publish throws, the row stays `PENDING`, and it's retried with exponential
backoff (2s/4s/8s/16s, then `FAILED` after five attempts for a human to look at). When the
broker comes back, the backlog drains.

**The follow-up they're waiting for:** *"How do you know the row isn't marked processed
before Kafka actually has it?"* Because the publisher **blocks on the broker ack**:

```java
kafkaTemplate.send(topic, key, payload).get(sendTimeout);
```

`send()` is asynchronous. If I returned without waiting, the relay would mark the row
`PROCESSED` immediately and a broker failure would silently eat the event *with the outbox
believing it had been delivered* — the exact failure the outbox exists to prevent. Blocking
is slower and it is correct.

---

## 2. Why not just call `kafkaTemplate.send()` inside `placeOrder()`? That's simpler.

Because that's a **dual write** — two systems, no shared transaction — and it is broken in a
way you cannot fix with a try/catch, because the process can die *between* the two calls.

```java
orderRepository.save(order);              // Postgres
kafkaTemplate.send("orders.placed", e);   // Kafka        ❌
```

- Send succeeds, commit fails → **the kitchen cooks a pizza for an order that doesn't
  exist.**
- Commit succeeds, send fails → **the customer is charged and nothing ever happens.**

You can't wrap them in one transaction; they're different systems with different
transaction managers. (And no, XA / two-phase commit is not the answer — it's slow, it has
its own failure modes, and Kafka doesn't meaningfully support it.)

The transactional outbox sidesteps it by writing to **one** system. The order row and the
event row commit together, atomically. The event exists **if and only if** the order does.
Delivery to Kafka becomes a separate, retryable problem — which is a much easier problem.

**Sharp follow-up:** *"So you've traded a correctness bug for latency — the relay polls
every 2s."* Yes, and that's the right trade. The customer's response isn't delayed; only
the kitchen's start is, by up to 2 seconds, on a pizza that takes minutes to make. If that
mattered, the upgrade path is CDC (Debezium tailing the Postgres WAL), which removes the
polling delay without giving up atomicity.

---

## 3. Why is every message keyed by order id? What breaks without it?

**The customer sees `READY` before `PREPARING`.**

Kafka only guarantees ordering **within a partition**, not across a topic. The producer
hashes the key to pick a partition. Key by order id, and every event for one order lands on
one partition, consumed in the order it was produced.

Leave it unkeyed and records round-robin across partitions. `orders.lifecycle` has three
partitions, consumed concurrently by different threads or pods, so `PREPARING` and `READY`
for the same pizza can be processed out of order. The status badge would jump backwards.

**Follow-up — "doesn't that limit throughput?"** It caps *per-order* parallelism at one, which
is exactly what I want: one pizza's state machine is inherently sequential. Throughput
across *different* orders is unaffected — they hash to different partitions and run fully in
parallel. Ordering is scoped to the thing that needs it and nothing more.

**Follow-up — "what about a hot key?"** Not a risk here: the key is a per-order UUID, so
it's uniformly distributed by construction. It *would* be a risk if I'd keyed by, say,
`restaurantId`.

---

## 4. Kafka is at-least-once. What happens when the same message is delivered twice?

**Nothing. The second delivery is a no-op — by design, not by luck.**

Redelivery is not an edge case, it's the contract: a consumer that does the work and then
dies before committing its offset *will* see the message again. So the handler has to be
idempotent.

The guard is the state machine that was already in the codebase:

```java
if (!from.canTransitionTo(target)) {
    return false;      // log and skip — NOT an error
}
```

On a redelivery of "advance to `CONFIRMED`", the order is *already* `CONFIRMED`, and
`CONFIRMED → CONFIRMED` isn't a legal transition. So we skip. No duplicate status-history
row, no second push to the customer, no dead-lettered message.

**The key insight to say out loud:** I didn't add a dedup table or a "processed message ids"
cache. I made the operation *naturally* idempotent by checking the current state instead of
blindly applying a delta. `SET status = READY` is idempotent; `status = status + 1` is not.
Prefer the former.

**Nice bonus to mention:** `Order` has a `@Version` column. If two pods somehow advance the
same order concurrently, one commits and the other fails with an optimistic-lock exception —
which is transient, so it's retried, and on the retry `canTransitionTo` sees the new status
and skips. The race resolves itself correctly.

---

## 5. You advance the order through three stages with a delay between each. Why not `Thread.sleep()` in the listener?

**Because it would stall the partition and eventually rebalance the entire consumer group.**

A `@KafkaListener` runs on the consumer thread — the same thread responsible for calling
`poll()`. Sleep in it and:

1. Every other partition assigned to that consumer stops being processed. One sleeping
   pizza blocks unrelated orders.
2. If the sleep exceeds `max.poll.interval.ms` (5 minutes by default), the broker concludes
   the consumer is dead, **evicts it from the group, and rebalances**. Every partition is
   reassigned, in-flight work is redelivered, and throughput craters. A 3-second nap becomes
   a cluster-wide stutter.

Instead, the listener **emits the next stage back onto Kafka as a new keyed message** and
returns immediately. The delay happens on a `TaskScheduler` thread — off the poll loop
entirely. The pipeline is self-perpetuating:

```
orders.placed → [CONFIRMED] → orders.lifecycle → [PREPARING] → orders.lifecycle → [READY] → stop
```

There's a `hop` counter on the event, capped at `maxHops`, so a bug in the next-stage
function can't cycle a message round the pipeline forever.

**The honest follow-up I'd volunteer:** that in-memory timer isn't durable. If the pod dies
inside the 3-second delay, the hop is lost and the order stops advancing. For a demo that's
acceptable (an admin can still push it forward), and I documented it. Making it durable
means a delay topic or a DB-backed scheduled job. **Volunteering the limitation before they
find it is worth more than the feature.**

---

## 6. Tell me about your retry strategy and the dead-letter topic.

`DefaultErrorHandler` + `DeadLetterPublishingRecoverer` with exponential backoff — but the
part that matters is the **classification**, not the retry.

Some failures will *never* succeed no matter how many times you try:

- a malformed payload (`DeserializationException`)
- an order id that doesn't exist (`ResourceNotFoundException`)
- an illegal state transition (`IllegalArgumentException`)

Retrying those is worse than useless. It burns the backoff budget, and — critically — **it
pins the partition**. Kafka delivers in order, so a poison message that keeps failing blocks
every message behind it. One bad record can stall a whole partition indefinitely. That's the
classic Kafka outage.

So those are classified as **non-retryable** and go **straight** to `<topic>.DLT`, skipping
retries entirely. Only genuinely transient failures — broker blip, DB timeout,
optimistic-lock clash — burn the retry budget.

**Two details that show depth:**

- The `ErrorHandlingDeserializer` wrapper is what makes a malformed payload *reachable* by
  the error handler at all. Without it, deserialization blows up before the listener is
  invoked, and the container just retries the same poison record forever.
- The DLT recoverer publishes with partition `-1` (let the broker choose) rather than
  copying the source partition. The DLT isn't guaranteed to have as many partitions as its
  source, and blindly copying partition 5 into a 3-partition DLT fails the send — so your
  dead-letter mechanism itself dies.

**"Why not `@RetryableTopic` / non-blocking retries?"** Overkill here. It creates a topic per
retry level and gives up ordering, which I explicitly need. Blocking retries with a short
backoff plus fast-fail classification gives me correctness without the topic sprawl.

---

## 7. You deploy this to Kubernetes with 2 replicas. What breaks?

**This is the sharpest question the design invites, and the answer is: the WebSocket pushes
would break — silently — if I hadn't handled it specifically.**

`WebSocketConfig` uses `enableSimpleBroker()`, which is an **in-memory STOMP broker living
inside one JVM**. A pod can only push to WebSocket sessions **it is personally holding**. It
has no way to reach a session parked on a different pod.

Now add a Kafka consumer group. With a *shared* group — the normal, obvious choice — Kafka
delivers each status change to **exactly one** pod. At `replicas: 2`, that pod is, half the
time, **not** the one holding that customer's socket. `convertAndSendToUser()` finds no
session, drops the message on the floor, and the customer's order tracker just... never
updates.

It works perfectly at `replicas: 1` and breaks the instant you scale out. **That's the worst
kind of bug** — invisible in dev, invisible in tests, appears only under the exact condition
you deploy to production in.

**The fix here:** the status-change listener gets a **unique consumer group per pod** — a
fresh UUID on every JVM start. That inverts competing-consumer semantics into **broadcast**:
every pod receives every status change, pushes to whatever sessions it happens to hold, and
no-ops for the rest. Cheap, no extra infrastructure.

Note the work listeners (`orders.placed`, `orders.lifecycle`) deliberately keep a **shared**
group — those are competing consumers and I emphatically do *not* want three pods each
cooking the same pizza. **Two consumer groups, two different semantics, both intentional.**

**One trap in the fix, worth mentioning unprompted:** the broadcast consumer must use
`auto.offset.reset=latest`. A brand-new group id combined with `earliest` would replay the
entire topic on every pod restart and blast every connected customer with a burst of stale
"your pizza is READY" toasts.

**And the honest ending:** the *correct* answer at real scale is `enableStompBrokerRelay()`
backed by RabbitMQ or ActiveMQ — the STOMP broker becomes shared infrastructure, any pod can
address any session, and this whole broadcast arrangement disappears. I didn't build it
because it means running a second broker next to Kafka to serve a demo app. **That's a
trade-off I made deliberately, not something I missed.**

---

## 8. You have a `@Scheduled` outbox relay and you're running N replicas. Don't they all dispatch the same events?

No — the claim is row-locked. But the *interesting* part is how.

The original query used a bare `PESSIMISTIC_WRITE` (`SELECT … FOR UPDATE`). That is
**correct but not scalable**: pod B's claim query *blocks* on the rows pod A is holding until
A's transaction commits. So N replicas take turns instead of working in parallel. The relay
silently degrades to single-threaded no matter how far you scale out, and every pod's poll
tick is hostage to the slowest dispatch anywhere in the fleet. **Nothing is broken — it's
just secretly serial**, which is the kind of thing that only shows up as a latency graph
nobody can explain.

I changed it to `SELECT … FOR UPDATE **SKIP LOCKED**`. The database now *passes over*
already-locked rows instead of waiting, so each pod claims a **disjoint** batch and they
drain the outbox concurrently. This is the standard pattern for a queue-in-a-table.

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))  // -2 = SKIP_LOCKED
```

**Detail worth knowing:** Postgres supports `SKIP LOCKED`; H2 doesn't, and Hibernate simply
omits the clause there. Harmless, because dev runs one instance — but it's the sort of
dialect gap that bites you if you assume your H2 tests prove your Postgres behaviour. (This
is also exactly why the project keeps one Testcontainers test against a *real* Postgres.)

---

## The three things to actually land

If you remember nothing else:

1. **"I never dual-write."** The order and the event are one transaction; Kafka is fed from
   that table. Correctness first.
2. **"At-least-once is safe because the handler is idempotent."** And it's idempotent because
   it checks state (`canTransitionTo`), not because of a dedup cache.
3. **"I know where this breaks."** The in-memory STOMP broker doesn't scale, the stage delay
   isn't durable, and I can tell you exactly what I'd build instead and why I didn't.

Point 3 is the one that separates senior from mid. **Confidently naming your design's limits
reads as judgment. Pretending it has none reads as inexperience.**
