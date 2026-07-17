# PizzaMaker — Architecture & Flow Guide

> Full-stack pizza ordering app: React 18 + Spring Boot 3 + PostgreSQL + WebSocket real-time tracking.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Auth Flow](#auth-flow)
4. [Order Placement Flow](#order-placement-flow)
5. [WebSocket Real-Time Flow](#websocket-real-time-flow)
6. [Feature Inventory](#feature-inventory)
7. [Project Structure](#project-structure)
8. [First-Time Setup](#first-time-setup)
9. [How to Run — All Environments](#how-to-run--all-environments)
10. [Deployment Strategy (Branches)](#deployment-strategy-branches)
11. [API Reference](#api-reference)
12. [Database Setup (Neon)](#database-setup-neon)
13. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer           | Technology                               | Why                                     |
| --------------- | ---------------------------------------- | --------------------------------------- |
| Frontend        | React 18 + Redux Toolkit                 | Industry standard, concurrent rendering |
| Routing         | React Router v5                          | Client-side SPA routing                 |
| HTTP Client     | Axios + interceptors                     | JWT attach, 401 auto-logout             |
| Real-time       | STOMP over SockJS                        | WebSocket with graceful fallback        |
| Notifications   | react-hot-toast                          | Lightweight, accessible toasts          |
| Backend         | Spring Boot 3.3.5 + Java 21 (LTS)        | Production-grade; 21 is what Boot 3.3 supports |
| Security        | Spring Security 6 + JWT (jjwt)           | Stateless, interview-ready              |
| ORM             | Spring Data JPA (Hibernate)              | Standard relational data access         |
| Database (dev)  | H2 in-memory                             | Zero setup for local dev                |
| Database (prod) | PostgreSQL on Neon (serverless)          | Free, resume-worthy, scalable           |
| Migrations      | Flyway                                   | Version-controlled schema               |
| API Docs        | Springdoc OpenAPI / Swagger UI           | Auto-generated, testable                |
| Event log       | Apache Kafka (KRaft, no Zookeeper)       | Durable, replayable, fans out to future consumers |
| Event delivery  | Transactional Outbox + polling relay     | Kills the dual-write problem — see below |
| Resilience      | Resilience4j retry + circuit breaker     | Transient downstream failures don't cascade |
| Orchestration   | Kubernetes + Helm                        | Multi-replica with health probes        |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (React 18)                       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Redux   │  │  Axios   │  │  STOMP   │  │ react-hot-   │  │
│  │  Store   │  │  Client  │  │ /SockJS  │  │    toast     │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────────┘  │
│       │             │              │                            │
└───────┼─────────────┼──────────────┼────────────────────────────┘
        │             │              │
        │       HTTP/REST       WebSocket
        │      (JWT Bearer)   (STOMP frames)
        │             │              │
┌───────┼─────────────┼──────────────┼────────────────────────────┐
│       │    SPRING BOOT 3 BACKEND   │                            │
│       │             │              │                            │
│  ┌────┴──────────────┴──┐  ┌───────┴──────────┐               │
│  │   REST Controllers   │  │  WebSocket Config │               │
│  │  /api/v1/auth        │  │  STOMP Broker     │               │
│  │  /api/v1/orders      │  │  /topic/orders    │               │
│  │  /api/v1/users       │  └──────────┬────────┘               │
│  │  /api/v1/menu        │             │                        │
│  └──────────┬───────────┘  ┌──────────┴────────┐               │
│             │              │  SimpMessagingTmpl │               │
│  ┌──────────┴───────────┐  └──────────┬────────┘               │
│  │      Services         │             │                        │
│  │  AuthService          │◄────────────┘                        │
│  │  OrderService ────────┼──► broadcast on status change        │
│  │  MenuService          │                                      │
│  │  NotificationService  │                                      │
│  └──────────┬───────────┘                                      │
│             │                                                   │
│  ┌──────────┴───────────┐                                      │
│  │  Spring Security 6   │                                      │
│  │  JwtAuthFilter       │                                      │
│  │  STATELESS sessions  │                                      │
│  └──────────┬───────────┘                                      │
│             │                                                   │
│  ┌──────────┴───────────┐                                      │
│  │   Spring Data JPA    │                                      │
│  │   UserRepository     │                                      │
│  │   OrderRepository    │                                      │
│  └──────────┬───────────┘                                      │
└─────────────┼───────────────────────────────────────────────────┘
              │
    ┌─────────┴──────────┐
    │  H2 (dev) /        │
    │  PostgreSQL (prod) │
    │  Neon serverless   │
    └────────────────────┘
```

---

## Auth Flow

```
User fills Login/Signup form
         │
         ▼
React validates fields inline (email format, password min 6)
         │
         ▼
POST /api/v1/auth/login  (or /register or /guest)
         │
         ▼
AuthService checks email exists + BCrypt.matches(password, hash)
         │
         ├─── FAIL ──► 401/409 ErrorResponse ──► toast.error shown
         │
         └─── OK ──► JwtTokenProvider.generateToken(email)
                              │
                              ▼
                      AuthResponse { token, uid, firstName, userType }
                              │
                              ▼
              localStorage.setItem('token', ...)
              localStorage.setItem('user', JSON.stringify({...}))
                              │
                              ▼
              Redux: userActions.setLoggedIn(true)
              Redux: buildUserDataInStore(userData)
                              │
                              ▼
              toast.success("Welcome back, {name}!")
                              │
                              ▼
              Redirect to Home (/)

─── Subsequent requests ───────────────────────────────────────────
Axios request interceptor reads localStorage token
Adds header:  Authorization: Bearer <jwt>
                              │
                              ▼
JwtAuthenticationFilter validates token → sets SecurityContext
                              │
                              ▼
Controller receives @AuthenticationPrincipal UserDetails

─── Token expiry / 401 ─────────────────────────────────────────────
Axios response interceptor catches 401
Clears localStorage + resets Redux store → window.location.replace('/login')
```

---

## Order Placement Flow

```
User selects toppings + crust size on PizzaHub page
         │
         ▼
Redux pizzahubSlice stores selections
Live price calculator reads state + /api/v1/menu/sizes
Displays: "Estimated Total $14.50"
         │
         ▼
User clicks "Order" button
  (disabled if not logged in OR nothing selected)
         │
         ▼
Navigate to /dashboard/checkout
Checkout.js shows pizza preview + ingredient table
         │
         ▼
User clicks "Order" on checkout
         │
         ▼
buildOrderPayload(orderState) maps Redux → OrderRequest:
  { sauce, mozzarella, cheese,
    pepperoni, pepperoniMedium,
    sausage, sausageMedium,
    peppers, peppersMedium,
    olives, olivesMedium,
    pizzaSize: <from Redux state> }
         │
         ▼
POST /api/v1/orders  (Bearer token attached by interceptor)
                     (optional Idempotency-Key header)
         │
         ▼
OrderService.placeOrder()  ─── ONE @Transactional BLOCK ────────────────┐
                                                                        │
  1. Idempotency check — a repeated Idempotency-Key returns the         │
     ORIGINAL order. Double-clicking "Order" must not buy two pizzas.   │
     The unique index on idempotency_key is the real guarantee; this    │
     lookup is just the fast path.                                      │
                                                                        │
  2. sanitizeToppings() — every topping id is checked against the       │
     active catalog. A tampered request is rejected, not accepted.      │
                                                                        │
  3. PricingService.computeTotal() — priced SERVER-SIDE. The client     │
     sends a price; we ignore it.                                       │
                                                                        │
  4. INSERT orders                   (status = PENDING)                 │
     INSERT order_line_items         (receipt snapshot — survives       │
                                      later price changes)              │
     INSERT order_status_history     (null -> PENDING)                  │
                                                                        │
  5. INSERT outbox_event             (ORDER_PLACED)  ◄── THE KEY MOVE   │
                                                                        │
  ──────────────────────────────────────────────────────────────────────┘
         │  commit
         ▼
   Return OrderResponse (status = PENDING) — the customer is done waiting.
         │
         ▼
Redux: orderActions.setCurrentOrder(data) → receipt modal


─── WHY STEP 5 IS A DATABASE ROW AND NOT A KAFKA SEND ─────────────────

The naive version is a DUAL WRITE — two systems, no shared transaction:

    orderRepository.save(order);              // system 1: Postgres
    kafkaTemplate.send("orders.placed", e);   // system 2: Kafka     ❌

The process can die between those two lines, and there is no try/catch
that fixes it:

    send OK  → commit fails  ⇒ the kitchen cooks an order that does not exist
    commit OK → send fails   ⇒ the customer is charged and NOTHING happens

The transactional outbox writes to ONE system instead of two. The order
row and the event row are the same commit — the event exists if and only
if the order does. A separate relay then moves it to Kafka.

─── THE RELAY ──────────────────────────────────────────────────────────

OutboxRelay  @Scheduled(fixedDelay = 2s)
  │
  ├─ claims a batch: SELECT ... FOR UPDATE SKIP LOCKED
  │     SKIP LOCKED (not a bare FOR UPDATE) is what lets N pods each
  │     claim a DIFFERENT batch instead of queueing behind one another.
  │
  ├─ OutboxDispatcher → KafkaOrderEventPublisher
  │     kafkaTemplate.send(topic, orderId, event).get(timeout)
  │                              ^^^^^^^ keyed, so one order's events
  │                                      share a partition and stay ordered
  │
  │     The .get() is deliberate. The send is async; if we didn't block,
  │     the row would be marked PROCESSED before the broker confirmed it,
  │     and a broker outage would silently eat the event.
  │
  ├─ ack received  → row = PROCESSED
  └─ send failed   → attempts++, exponential backoff (2s/4s/8s/16s),
                     FAILED after 5 tries. Never silently dropped.

─── THE KITCHEN (Kafka consumer) ───────────────────────────────────────

orders.placed
  │
  ▼
OrderLifecycleListener.onOrderPlaced()
  ├─ NotificationService.sendOrderConfirmation()
  └─ emit OrderLifecycleEvent(oid, CONFIRMED, hop=1) ──┐
                                                       │ (after a short
                                                       │  delay, scheduled
   ┌───────────────────────────────────────────────────┘  OFF the consumer
   ▼                                                      thread)
orders.lifecycle
  │
  ▼
OrderLifecycleListener.onLifecycleStage()
  ├─ hop > maxHops?  → NonRetryableEventException → DLT   (loop fuse)
  │
  ├─ orderService.advanceStatusIfPossible(oid, target)
  │     └─ !canTransitionTo(target)?  → log + SKIP, not an error.
  │        This is the IDEMPOTENCY GUARD. Kafka is at-least-once, so a
  │        redelivered message must not double-apply. And if an admin
  │        moved the order first, they win and our hop no-ops.
  │
  └─ emit the next stage → orders.lifecycle  (self-perpetuating)

     CONFIRMED → PREPARING → READY → stop.
     (DELIVERED is a courier's act, so it stays admin-driven.)

  NOTE: the stage delay is scheduled on a TaskScheduler, NOT Thread.sleep()
  inside the listener. Sleeping in a @KafkaListener holds the consumer
  thread, stalls every partition assigned to it, and once it exceeds
  max.poll.interval.ms the broker evicts the member and rebalances the
  whole group.
```

---

## WebSocket Real-Time Flow

```
─── On Orders page load ────────────────────────────────────────────

useOrderUpdates hook activates:
  new Client({ webSocketFactory: () => new SockJS('/ws') })
  client.activate()
  onConnect → client.subscribe('/user/queue/orders', handler)
                                ^^^^^ per-USER destination, not a topic

StompAuthChannelInterceptor validates the JWT on the STOMP CONNECT frame,
so Spring knows the principal and can route /user/** to the right session.

Green pulsing "Live" dot shown in Orders page header

─── A status change happens ────────────────────────────────────────

Two things can move an order:
  (a) the Kafka lifecycle consumer (the normal path), or
  (b) an admin: PUT /api/v1/orders/{oid}/status
Both converge on the same code.

          OrderService.applyTransition():
            1. order.setStatus(PREPARING)
            2. save  (@Version column → optimistic lock, so two pods
                      racing the same order can't both apply it)
            3. INSERT order_status_history
            4. INSERT outbox_event (ORDER_STATUS_CHANGED)  ← same TX
                    │
                    ▼
          OutboxRelay → Kafka topic: orders.status-changed
                    │
                    ▼
          OrderStatusBroadcastListener   (on EVERY pod — see below)
                    │
                    ▼
          messagingTemplate.convertAndSendToUser(
              email, "/queue/orders",
              OrderStatusUpdateResponse(oid, uid, PREPARING))
                    │
                    ▼  routed to that ONE customer's session
                    │
         ┌──────────┴─────────────────────┐
         │  Only the owning user's browser │
         └──────────┬─────────────────────┘
                    ▼
         Status badge updates: PENDING → PREPARING  (no refresh)
         toast: "Order #abc123… is now PREPARING"
```

### The multi-replica problem (and why the consumer group is per-pod)

`WebSocketConfig` uses `enableSimpleBroker()` — an **in-memory STOMP broker, inside one
JVM**. A pod can therefore only push to WebSocket sessions **it is personally holding**. It
has no way to reach a session parked on another pod.

That makes the Kafka consumer group choice load-bearing:

```
        SHARED consumer group                 UNIQUE group PER POD
        (what NOT to do)                      (what we do)

  orders.status-changed                  orders.status-changed
         │                                    │        │
         ▼ (exactly one pod)                  ▼        ▼   (all pods)
      ┌──────┐  ┌──────┐                  ┌──────┐  ┌──────┐
      │ Pod A│  │ Pod B│                  │ Pod A│  │ Pod B│
      │      │  │ ★    │                  │ ★    │  │ ★    │
      └──────┘  └──────┘                  └──────┘  └──────┘
         │          │                        │          │
    holds Alice's   got the                holds     no session
    socket          message                Alice's   → no-op
                    but holds              socket
                    nobody                 → pushes  ✓
                    → DROPPED ✗
```

With a shared group, Kafka delivers each status change to exactly one pod — usually **not**
the one holding that customer's socket — and `convertAndSendToUser()` finds nothing and
silently drops it. It works perfectly at `replicas: 1` and breaks the moment you scale out.

Giving each pod a unique group id (a fresh UUID per JVM start) converts competing-consumer
semantics into **broadcast**: every pod sees every change, pushes to whatever sessions it
holds, no-ops for the rest.

Two consequences worth knowing:

- The broadcast consumer **must** use `auto.offset.reset=latest`. A brand-new group id plus
  `earliest` would replay the entire topic on every pod restart and blast every connected
  customer with a burst of stale "your pizza is READY" toasts.
- Each restart leaves a dead consumer group behind. Kafka reaps empty groups after
  `offsets.retention.minutes` (7 days), so it's bounded litter, not a leak.

**The correct answer at real scale** is `enableStompBrokerRelay()` pointed at RabbitMQ or
ActiveMQ: the STOMP broker becomes shared infrastructure, any pod can address any session,
and this whole broadcast arrangement disappears. It is deliberately not built here — it
means running a second broker alongside Kafka to serve a demo app. That is a conscious
trade-off, not an oversight.

---

## Feature Inventory

### Backend

| Feature                         | File(s)                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| JWT auth (register/login/guest) | `AuthService`, `AuthController`, `JwtTokenProvider`         |
| JWT filter (stateless)          | `JwtAuthenticationFilter`                                   |
| Order CRUD (paginated)          | `OrderService`, `OrderController`, `OrderRepository`        |
| Admin-only endpoints            | `SecurityConfig` (`hasRole("ADMIN")`)                       |
| Admin seed on startup           | `DataSeeder` (creates admin on first boot)                  |
| Async notification              | `NotificationService` (`@Async`)                            |
| Menu/pricing API                | `MenuService`, `MenuController`                             |
| User profile API                | `UserController`                                            |
| Global error handling           | `GlobalExceptionHandler`                                    |
| DB migrations                   | `V1__create_users_table.sql`, `V2__create_orders_table.sql` |
| WebSocket broadcast             | `WebSocketConfig`, `OrderService.updateStatus()`            |
| OpenAPI docs                    | `OpenApiConfig`, `/swagger-ui/index.html`                   |
| HikariCP tuning                 | `application-prod.yml`                                      |

### Frontend

| Feature                                  | File(s)                             |
| ---------------------------------------- | ----------------------------------- |
| JWT interceptor (attach + 401 logout)    | `api/axiosClient.js`                |
| Session restore from localStorage        | `containers/Firebase/Auth.js`       |
| Login/Signup with inline validation      | `LoginPage.js`, `SignUp.js`         |
| Loading states on all form submits       | same                                |
| Toast notifications (all API calls)      | `react-hot-toast` wired in `App.js` |
| Live price calculator                    | `PizzaHub.js` + `menuSlice.js`      |
| Pizza topping pop animation              | `toppingsMenu.module.css`           |
| Order history with status badges         | `Orders.js`                         |
| WebSocket live status updates            | `hooks/useOrderUpdates.js`          |
| Receipt-style confirmation modal         | `Modal.js`                          |
| Profile page (avatar, badge, links)      | `Profile.js`                        |
| Admin panel (all orders + status update) | `Admin/AdminPanel.js`               |
| Admin nav link (ADMIN users only)        | `DashboardMenu.js`                  |
| Mobile responsive layout                 | all CSS files                       |
| React 18 createRoot                      | `index.js`                          |

---

## Project Structure

```
PizzaMaker/
├── .github/workflows/
│   └── ci.yml                        ← CI: Java build + test on push
├── backend/                          ← Spring Boot 3 API
│   ├── pom.xml
│   ├── Dockerfile                    ← Multi-stage Maven → JRE build
│   └── src/main/
│       ├── java/com/pizzamaker/
│       │   ├── config/
│       │   │   ├── AsyncConfig.java
│       │   │   ├── DataSeeder.java
│       │   │   ├── OpenApiConfig.java
│       │   │   ├── SecurityConfig.java
│       │   │   └── WebSocketConfig.java
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── MenuController.java
│       │   │   ├── OrderController.java
│       │   │   └── UserController.java
│       │   ├── dto/
│       │   │   ├── request/
│       │   │   └── response/
│       │   ├── entity/
│       │   │   ├── Order.java
│       │   │   ├── OrderStatus.java  ← PENDING→CONFIRMED→PREPARING→READY→DELIVERED
│       │   │   ├── User.java
│       │   │   └── UserType.java     ← STANDARD | GUEST | ADMIN
│       │   ├── mapper/
│       │   │   ├── OrderMapper.java
│       │   │   └── UserMapper.java
│       │   ├── repository/
│       │   │   ├── OrderRepository.java
│       │   │   └── UserRepository.java
│       │   ├── security/
│       │   │   ├── JwtAuthenticationFilter.java
│       │   │   ├── JwtTokenProvider.java
│       │   │   └── UserDetailsServiceImpl.java
│       │   └── service/
│       │       ├── AuthService.java
│       │       ├── MenuService.java
│       │       ├── NotificationService.java
│       │       └── OrderService.java
│       └── resources/
│           ├── application.yml           ← H2 dev config
│           ├── application-prod.yml      ← PostgreSQL prod config
│           └── db/migration/
│               ├── V1__create_users_table.sql
│               └── V2__create_orders_table.sql
│
├── src/                              ← React 18 frontend
│   ├── api/axiosClient.js
│   ├── hooks/useOrderUpdates.js      ← STOMP WebSocket hook
│   ├── store/                        ← Redux Toolkit slices
│   │   ├── index.js
│   │   ├── menuSlice.js
│   │   ├── orderSlice.js
│   │   ├── pizzahubSlice.js
│   │   ├── uiSlice.js
│   │   └── userSlice.js
│   ├── containers/
│   │   ├── Admin/AdminPanel.js
│   │   ├── Checkout/Checkout.js
│   │   ├── Firebase/
│   │   │   ├── Auth.js
│   │   │   └── Firebase.js
│   │   ├── LoginPage/LoginPage.js
│   │   ├── Orders/Orders.js
│   │   ├── PizzaHub/PizzaHub.js
│   │   ├── Profile/Profile.js
│   │   └── SignUp/SignUp.js
│   └── components/UI/
│       ├── Modal/Modal.js
│       ├── DashboardMenu/
│       └── UserDashboard/
│
├── ARCHITECTURE.md
├── docker-compose.yml
├── .env.example                      ← template — copy to .env and fill in values
├── .npmrc
├── package.json
└── README.md
```

---

## First-Time Setup

### Prerequisites

| Tool           | Version | How to check    |
| -------------- | ------- | --------------- |
| Java (Temurin) | 21      | `java -version` |
| Node.js        | 18+     | `node -v`       |
| npm            | 8+      | `npm -v`        |

### Step 1 — Create your `.env` file

Copy `.env.example` to `.env` at the project root and fill in values:

```
REACT_APP_API_URL=http://localhost:8080
```

This file is gitignored. For local dev with H2 this one line is all you need.

### Step 2 — Install frontend dependencies

```bash
npm install
```

If this fails with peer-dep errors, run:

```bash
npm install --legacy-peer-deps
```

### Step 3 — Start the backend

```bash
cd backend
./mvnw spring-boot:run       # macOS/Linux
.\mvnw.cmd spring-boot:run   # Windows
```

Wait for `Started PizzaMakerApplication`. On first boot:

- Flyway runs V1 + V2 migrations
- `DataSeeder` creates the initial admin user (ROLE_ADMIN)

Verify:

```
http://localhost:8080/actuator/health          → {"status":"UP"}
http://localhost:8080/swagger-ui/index.html    → full API explorer
http://localhost:8080/h2-console               → DB browser (dev only)
```

H2 console connection:

- JDBC URL: `jdbc:h2:mem:pizzadb`
- User: `sa` | Password: _(blank)_

### Step 4 — Start the frontend

```bash
npm start
```

Opens `http://localhost:3000`. The `cross-env NODE_OPTIONS=--openssl-legacy-provider` is baked into `package.json`.

### Common first-run problems

| Symptom                                                | Cause                                 | Fix                                                       |
| ------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------- |
| Backend fails: "DDL mismatch" or Flyway checksum error | Stale `target/` folder                | Delete `backend/target` and rerun                         |
| `npm install` peer dep errors                          | MUI v4 / React 18 version mismatch    | Run `npm install --legacy-peer-deps`                      |
| Frontend shows "Network Error" on login                | Backend not running, or wrong API URL | Check `.env`, confirm backend is on `:8080`               |
| WebSocket "Live" dot grey/red                          | CORS mismatch                         | Verify `ALLOWED_ORIGINS` env var matches the frontend URL |
| H2 console: table not found                            | Wrong JDBC URL                        | Use exactly `jdbc:h2:mem:pizzadb`                         |
| Render free tier: first request hangs ~30s             | Backend spun down after 15 min idle   | Wait for cold start; subsequent requests are fast         |

---

## How to Run — All Environments

### Local Dev — H2 (default, no cloud DB)

```bash
# Terminal 1 — backend
cd backend
./mvnw spring-boot:run       # macOS/Linux
.\mvnw.cmd spring-boot:run   # Windows

# Terminal 2 — frontend
npm start
```

H2 data resets on every backend restart.

---

### Local Dev — Neon PostgreSQL (persistent data)

Set env vars before starting the backend:

```bash
# macOS/Linux
export SPRING_PROFILES_ACTIVE=prod
export DATABASE_URL=jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require
export DATABASE_USERNAME=your-neon-user
export DATABASE_PASSWORD=your-neon-password
export JWT_SECRET=your-base64-256bit-secret
export ALLOWED_ORIGINS=http://localhost:3000
```

```powershell
# Windows PowerShell
$env:SPRING_PROFILES_ACTIVE = "prod"
$env:DATABASE_URL           = "jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require"
$env:DATABASE_USERNAME      = "your-neon-user"
$env:DATABASE_PASSWORD      = "your-neon-password"
$env:JWT_SECRET             = "your-base64-256bit-secret"
$env:ALLOWED_ORIGINS        = "http://localhost:3000"
```

Then start the backend as normal. Frontend is unchanged — `npm start`.

---

### Docker (local PostgreSQL, no cloud needed)

Create a `.env` file at project root (gitignored):

```
POSTGRES_PASSWORD=yourpassword
JWT_SECRET=yourbase64secret
ALLOWED_ORIGINS=http://localhost:3000
```

Then:

```bash
docker-compose up --build
```

Backend on `:8080`, Postgres on `:5432`. Run frontend separately via `npm start`.

---

### Production — Render (backend) + Cloudflare Pages (frontend)

**Backend on Render:**

Set these in Render → Service → Environment:

| Key                      | Value                                                       |
| ------------------------ | ----------------------------------------------------------- |
| `SPRING_PROFILES_ACTIVE` | `prod`                                                      |
| `DATABASE_URL`           | Neon JDBC URL (`jdbc:postgresql://...`)                     |
| `DATABASE_USERNAME`      | Neon username                                               |
| `DATABASE_PASSWORD`      | Neon password                                               |
| `JWT_SECRET`             | base64-encoded 256-bit secret (`openssl rand -base64 32`)   |
| `JWT_EXPIRATION_MS`      | `86400000`                                                  |
| `ALLOWED_ORIGINS`        | `https://your-app.pages.dev,https://your-custom-domain.com` |

**Frontend on Cloudflare Pages:**

Build settings:

- Build command: `npm run build`
- Output directory: `build`
- Node version: 18

Environment variable:

| Key                 | Value                                      |
| ------------------- | ------------------------------------------ |
| `REACT_APP_API_URL` | `https://your-render-service.onrender.com` |

**Notes:**

- Render free tier spins down after 15 minutes idle — the first request then eats
  a 30–60s cold start (container wake + Spring Boot boot). Warm, every call is
  <1s. Two things soften this:
  - **Keep-warm cron** (`.github/workflows/keep-warm.yml`) pings a lightweight,
    CORS-open, DB-free endpoint every ~12 min so the instance rarely sleeps.
    GitHub cron is best-effort; UptimeRobot is a more punctual alternative.
  - **Warm-up overlay** (`src/shared/WarmupOverlay`, driven by
    `src/api/warmup.js` off the axios interceptors) shows a branded "Firing up
    the oven" state whenever a request outlives ~1.8s, so a cold start reads as
    intentional rather than broken. It never appears on a warm backend. This is
    distinct from `ApiGate`, which only covers the initial page load.
- `ALLOWED_ORIGINS` must include every domain the frontend is served from.
- WebSocket CORS is driven by the same `ALLOWED_ORIGINS` env var.

---

## Deployment Strategy (Branches)

```
master          ← production only — Pages + Render auto-deploy from here
  └── develop   ← integration branch — all features merge here first
        └── feature/xxx  ← individual work branches
```

**Workflow:**

1. Cut a `feature/xxx` branch from `develop`
2. Work locally, push to `feature/xxx`
3. Open PR into `develop` — CI runs Java tests
4. When `develop` is stable and manually tested, open a PR from `develop` → `master`
5. Review the diff carefully, then merge — triggers one deliberate production deploy
6. **Never push directly to `master`**

**Cloudflare Pages:** production branch `master`, preview branch `develop`.

**Render:** auto-deploy on `master` only.

---

## API Reference

> Full interactive docs at `http://localhost:8080/swagger-ui/index.html`

### Auth (public)

| Method | Path                    | Body                             | Response       |
| ------ | ----------------------- | -------------------------------- | -------------- |
| POST   | `/api/v1/auth/register` | `{firstName, emailId, password}` | `AuthResponse` |
| POST   | `/api/v1/auth/login`    | `{emailId, password}`            | `AuthResponse` |
| POST   | `/api/v1/auth/guest`    | `{firstName, emailId}`           | `AuthResponse` |

`AuthResponse`: `{ token, type: "Bearer", uid, firstName, userType }`

### Users (authenticated)

| Method | Path               | Response       |
| ------ | ------------------ | -------------- |
| GET    | `/api/v1/users/me` | `UserResponse` |

### Orders (authenticated)

| Method | Path                          | Notes                             |
| ------ | ----------------------------- | --------------------------------- |
| POST   | `/api/v1/orders`              | Place order — `OrderRequest` body |
| GET    | `/api/v1/orders/my`           | Your orders (paginated)           |
| GET    | `/api/v1/orders/{oid}`        | Single order (owner only)         |
| GET    | `/api/v1/orders`              | All orders — **ADMIN only**       |
| PUT    | `/api/v1/orders/{oid}/status` | Update status — **ADMIN only**    |

### Menu (public)

| Method | Path                    | Response                 |
| ------ | ----------------------- | ------------------------ |
| GET    | `/api/v1/menu/toppings` | List of toppings         |
| GET    | `/api/v1/menu/sizes`    | `{ R: 8, M: 12, L: 16 }` |

### WebSocket

| Endpoint              | Protocol        | Notes                                                                |
| --------------------- | --------------- | ------------------------------------------------------------------- |
| `/ws`                 | SockJS/STOMP    | Connect point. JWT is validated on the CONNECT frame.               |
| `/user/queue/orders`  | STOMP subscribe | Receive `OrderStatusUpdateResponse { oid, userUid, status }`.       |
|                       |                 | A **per-user** destination — you only ever get your own orders.     |
|                       |                 | (Not a `/topic/` broadcast: that would send every customer's order  |
|                       |                 | status to every connected browser and rely on the client to filter.)|

---

## Database Setup (Neon)

Production Postgres runs on **Neon**, not Render. Render's free Postgres is deleted after
90 days; Neon's free tier is free-forever (0.5 GB, autosuspends, ~1s wake). The backend
depends only on a `DATABASE_URL`, so nothing on the app side is tied to a specific host —
`render.yaml` provisions the web service alone.

1. Go to [neon.tech](https://neon.tech) → sign up free → **New Project** → name it `pizzamaker`
2. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Convert to JDBC format:
   ```
   jdbc:postgresql://ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. In Render → backend service → Environment, set `DATABASE_URL`, `DATABASE_USERNAME`,
   `DATABASE_PASSWORD` (the `sync: false` keys in `render.yaml`), with
   `SPRING_PROFILES_ACTIVE=prod`
5. Redeploy. Flyway runs every migration automatically on first boot, and `DataSeeder`
   re-adds the admin user — a fresh Neon database needs no manual migration.
6. To carry existing data across before the old Render DB is suspended:
   ```
   pg_dump "<render-internal-conn>" | psql "<neon-conn>"
   ```

---

## Environment Variables

### Backend

| Variable                 | Default                 | Description                                                                     |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL`           | H2 (dev)                | JDBC connection string                                                          |
| `DATABASE_USERNAME`      | `sa`                    | DB user                                                                         |
| `DATABASE_PASSWORD`      | _(blank)_               | DB password                                                                     |
| `JWT_SECRET`             | hardcoded dev key       | Base64-encoded HMAC secret (min 32 bytes) — generate: `openssl rand -base64 32` |
| `JWT_EXPIRATION_MS`      | `86400000`              | Token lifetime (24 hours)                                                       |
| `SPRING_PROFILES_ACTIVE` | default                 | Set to `prod` for PostgreSQL                                                    |
| `ALLOWED_ORIGINS`        | `http://localhost:3000` | Comma-separated allowed origins for CORS and WebSocket                          |

### Frontend

| Variable            | Default                 | Description      |
| ------------------- | ----------------------- | ---------------- |
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend base URL |

Set in a `.env` file at project root (gitignored):

```
REACT_APP_API_URL=http://localhost:8080
```

---

_Never push directly to `master`. Branch from `develop`, test, then promote via PR._
