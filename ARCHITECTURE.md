# PizzaMaker — Architecture, Flow & Usage Guide

> Full-stack pizza ordering app: React 18 + Spring Boot 3 + PostgreSQL + WebSocket real-time tracking.

---

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [Auth Flow](#auth-flow)
4. [Order Placement Flow](#order-placement-flow)
5. [WebSocket Real-Time Flow](#websocket-real-time-flow)
6. [Known Bugs & Issues](#known-bugs--issues)
7. [Feature Inventory](#feature-inventory)
8. [Project Structure](#project-structure)
9. [First-Time Setup](#first-time-setup)
10. [How to Run — All Environments](#how-to-run--all-environments)
11. [Deployment Strategy (Branches)](#deployment-strategy-branches)
12. [How to Use the App](#how-to-use-the-app)
13. [API Reference](#api-reference)
14. [Database Setup (Neon)](#database-setup-neon)
15. [Environment Variables](#environment-variables)
16. [Commit History](#commit-history)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Redux Toolkit | Industry standard, concurrent rendering |
| Routing | React Router v5 | Client-side SPA routing |
| HTTP Client | Axios + interceptors | JWT attach, 401 auto-logout |
| Real-time | STOMP over SockJS | WebSocket with graceful fallback |
| Notifications | react-hot-toast | Lightweight, accessible toasts |
| Backend | Spring Boot 3.3.5 + Java 21 | Production-grade, FAANG standard |
| Security | Spring Security 6 + JWT (jjwt) | Stateless, interview-ready |
| ORM | Spring Data JPA (Hibernate) | Standard relational data access |
| Database (dev) | H2 in-memory | Zero setup for local dev |
| Database (prod) | PostgreSQL on Neon (serverless) | Free, resume-worthy, scalable |
| Migrations | Flyway | Version-controlled schema |
| API Docs | Springdoc OpenAPI / Swagger UI | Auto-generated, testable |
| Async | Spring `@Async` + ThreadPoolTaskExecutor | Non-blocking notification simulation |

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
Clears localStorage → window.location.href = '/login'
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
    pizzaSize: <from Redux state> }   ← ⚠ BUG: currently hardcoded "M"
         │
         ▼
POST /api/v1/orders  (Bearer token attached by interceptor)
         │
         ▼
OrderService.placeOrder():
  1. Load User from DB by email
  2. Build Order entity with UUID oid
  3. Save to orders table (status = PENDING)
  4. @Async NotificationService.sendOrderConfirmation() — simulates email
  5. Return OrderResponse
         │
         ▼
Redux: orderActions.setCurrentOrder(data)
toast.success("Order #abc123 placed!")
Navigate to /confirm
         │
         ▼
Modal (receipt): shows oid, size, toppings, status=PENDING
Two buttons: "View Orders" | "Back to Menu"
```

---

## WebSocket Real-Time Flow

```
─── On Orders page load ────────────────────────────────────────────

useOrderUpdates hook activates:
  new Client({ webSocketFactory: () => new SockJS('/ws') })
  client.activate()
  onConnect → client.subscribe('/topic/orders', handler)

Green pulsing "Live" dot shown in Orders page header

─── When admin updates order status ────────────────────────────────

Admin Panel: PUT /api/v1/orders/{oid}/status  { status: "PREPARING" }
                    │
                    ▼
          OrderService.updateStatus():
            1. Find order by oid
            2. order.setStatus(PREPARING)
            3. orderRepository.save(order)
            4. messagingTemplate.convertAndSend(
                 "/topic/orders",
                 OrderStatusUpdate(oid, userUid, PREPARING)
               )
                    │
                    ▼  (STOMP frame broadcast)
                    │
         ┌──────────┴────────────────────┐
         │  All connected browsers        │
         │  subscribed to /topic/orders   │
         └──────────┬────────────────────┘
                    ▼
         useOrderUpdates handler fires:
           update = { oid, userUid, status: "PREPARING" }

           if (update.userUid !== currentUser.uid) return  ← filter
                    │
                    ▼
         setOrders(prev => prev.map(o =>
           o.oid === update.oid ? {...o, status: update.status} : o
         ))
                    │
                    ▼
         Status badge updates: PENDING → 👨‍🍳 PREPARING  (no refresh)
         toast: "👨‍🍳 Order #abc123… is now PREPARING"
```

---

## Known Bugs & Issues

### CRITICAL — Fix before users hit these

| # | Bug | File | Impact |
|---|-----|------|--------|
| 1 | **Pizza size hardcoded to `"M"`** — `pizzaSize: 'M'` in `buildOrderPayload()` ignores the user's R/L selection entirely | `src/containers/Firebase/Firebase.js` | Every order is size Medium regardless of what was picked; price shown is wrong |
| 2 | **Hardcoded secrets in docker-compose.yml** — `POSTGRES_PASSWORD` and `JWT_SECRET` are committed in plaintext | `docker-compose.yml` | Secret exposure if repo is public |
| 3 | **WebSocket CORS hardcoded** — `WebSocketConfig.java` hardcodes `localhost:3000` and `*.pages.dev`; any new deploy domain breaks WebSocket | `backend/.../config/WebSocketConfig.java` | Real-time updates fail on new deployments |

### HIGH — Visible production bugs

| # | Bug | File | Impact |
|---|-----|------|--------|
| 4 | **Admin Customer column always shows `—`** — `OrderMapper.toResponse()` never populates `userEmail`, but `AdminPanel.js` reads `order.userEmail` | `OrderMapper.java`, `AdminPanel.js` | Admin can't see which customer placed which order |
| 5 | **CORS `allowedHeaders: "*"`** too permissive | `SecurityConfig.java` | Security exposure; should be `["Content-Type", "Authorization"]` |
| 6 | **Admin seeder logs plaintext credentials** on every startup | `DataSeeder.java` | Credentials visible in Render's log dashboard |
| 7 | **`window.location.href` on 401 doesn't clear Redux state** — stale user data can leak to next session | `src/api/axiosClient.js` | Dirty state after session expiry |

### MEDIUM — Silent failures or bad UX

| # | Issue | File |
|---|-------|------|
| 8 | Redux `serializableCheck: false` disables crash protection and breaks DevTools time-travel | `src/store/index.js` |
| 9 | WebSocket parse errors silently swallowed with `catch (_) {}` | `src/hooks/useOrderUpdates.js` |
| 10 | No rate limiting on `/api/v1/auth/*` — brute-force logins are unchecked | `SecurityConfig.java` |
| 11 | Admin orders list capped at 50, no pagination UI | `AdminPanel.js` |
| 12 | Price calculator silently defaults to M size if none selected | `PizzaHub.js` |

### LOW — Nice to fix

| # | Issue |
|---|-------|
| 13 | JWT stored in `localStorage` (XSS risk); httpOnly cookies would be safer |
| 14 | No HTTPS enforcement in prod Spring profile |
| 15 | Email regex accepts `foo@bar.c` (no TLD length check) |
| 16 | No idempotency key on order placement — double-submit creates duplicate orders |
| 17 | Material-UI v4 is unmaintained; upgrade to MUI v5 |

---

## Feature Inventory

### Backend
| Feature | File(s) |
|---------|---------|
| JWT auth (register/login/guest) | `AuthService`, `AuthController`, `JwtTokenProvider` |
| JWT filter (stateless) | `JwtAuthenticationFilter` |
| Order CRUD (paginated) | `OrderService`, `OrderController`, `OrderRepository` |
| Admin-only endpoints | `SecurityConfig` (`hasRole("ADMIN")`) |
| Admin seed on startup | `DataSeeder` (admin@pizzamaker.com / admin123) |
| Async notification | `NotificationService` (`@Async`) |
| Menu/pricing API | `MenuService`, `MenuController` |
| User profile API | `UserController` |
| Global error handling | `GlobalExceptionHandler` |
| DB migrations | `V1__create_users_table.sql`, `V2__create_orders_table.sql` |
| WebSocket broadcast | `WebSocketConfig`, `OrderService.updateStatus()` |
| OpenAPI docs | `OpenApiConfig`, `/swagger-ui/index.html` |
| HikariCP tuning | `application-prod.yml` |

### Frontend
| Feature | File(s) |
|---------|---------|
| JWT interceptor (attach + 401 logout) | `api/axiosClient.js` |
| Session restore from localStorage | `containers/Firebase/Auth.js` |
| Login/Signup with inline validation | `LoginPage.js`, `SignUp.js` |
| Loading states on all form submits | same |
| Toast notifications (all API calls) | `react-hot-toast` wired in `App.js` |
| Live price calculator | `PizzaHub.js` + `menuSlice.js` |
| Pizza topping pop animation | `toppingsMenu.module.css` |
| Order history with status badges | `Orders.js` |
| WebSocket live status updates | `hooks/useOrderUpdates.js` |
| Receipt-style confirmation modal | `Modal.js` |
| Profile page (avatar, badge, links) | `Profile.js` |
| Admin panel (all orders + status update) | `Admin/AdminPanel.js` |
| Admin nav link (ADMIN users only) | `DashboardMenu.js` |
| Mobile responsive layout | all CSS files |
| React 18 createRoot | `index.js` |

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
│       │   │   ├── DataSeeder.java   ← seeds admin user on startup
│       │   │   ├── OpenApiConfig.java
│       │   │   ├── SecurityConfig.java   ← JWT + CORS + role rules
│       │   │   └── WebSocketConfig.java  ← STOMP broker (⚠ hardcoded CORS)
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── MenuController.java
│       │   │   ├── OrderController.java
│       │   │   └── UserController.java
│       │   ├── dto/
│       │   │   ├── request/          ← LoginRequest, RegisterRequest, OrderRequest …
│       │   │   └── response/         ← AuthResponse, OrderResponse, OrderStatusUpdate …
│       │   ├── entity/
│       │   │   ├── Order.java
│       │   │   ├── OrderStatus.java  ← PENDING→CONFIRMED→PREPARING→READY→DELIVERED
│       │   │   ├── User.java
│       │   │   └── UserType.java     ← STANDARD | GUEST | ADMIN
│       │   ├── mapper/
│       │   │   ├── OrderMapper.java  ← ⚠ missing userEmail field
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
│   ├── api/axiosClient.js            ← Axios + JWT interceptor (⚠ dirty logout)
│   ├── hooks/useOrderUpdates.js      ← STOMP WebSocket hook
│   ├── store/                        ← Redux Toolkit slices
│   │   ├── index.js                  ← ⚠ serializableCheck disabled
│   │   ├── menuSlice.js              ← pricing state
│   │   ├── orderSlice.js
│   │   ├── pizzahubSlice.js          ← pizza customisation state
│   │   ├── uiSlice.js
│   │   └── userSlice.js
│   ├── containers/
│   │   ├── Admin/AdminPanel.js       ← admin dashboard (⚠ userEmail always '—')
│   │   ├── Checkout/Checkout.js
│   │   ├── Firebase/
│   │   │   ├── Auth.js              ← login/signup/guest/logout
│   │   │   └── Firebase.js          ← ⚠ pizzaSize hardcoded 'M' in buildOrderPayload
│   │   ├── LoginPage/LoginPage.js
│   │   ├── Orders/Orders.js          ← live WebSocket updates
│   │   ├── PizzaHub/PizzaHub.js      ← live price calculator
│   │   ├── Profile/Profile.js
│   │   └── SignUp/SignUp.js
│   └── components/UI/
│       ├── Modal/Modal.js            ← receipt confirmation
│       ├── DashboardMenu/            ← admin link for ADMIN users
│       └── UserDashboard/            ← routes all dashboard pages
│
├── ARCHITECTURE.md                   ← this file
├── docker-compose.yml                ← ⚠ hardcoded secrets — use .env instead
├── .env.example                      ← template — copy to .env and fill in values
├── .npmrc                            ← legacy-peer-deps=true
├── package.json
└── README.md
```

---

## First-Time Setup

### Prerequisites

| Tool | Version | How to check |
|------|---------|--------------|
| Java (Temurin) | 21 | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 18+ | `node -v` |
| npm | 8+ | `npm -v` |

### Step 1 — Create your `.env` file

Copy `.env.example` to `.env` at the project root and fill in values:

```
REACT_APP_API_URL=http://localhost:8080
```

This file is gitignored. For local dev with H2 this one line is all you need.

### Step 2 — Install frontend dependencies

```powershell
cd C:\Projects\PizzaMaker
npm install
```

If this fails with peer-dep errors, run:
```powershell
npm install --legacy-peer-deps
```

### Step 3 — Start the backend

```powershell
cd C:\Projects\PizzaMaker\backend
C:\tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

Wait for `Started PizzaMakerApplication`. On first boot:
- Flyway runs V1 + V2 migrations
- `DataSeeder` creates: `admin@pizzamaker.com` / `admin123` (ROLE_ADMIN)

Verify:
```
http://localhost:8080/actuator/health          → {"status":"UP"}
http://localhost:8080/swagger-ui/index.html    → full API explorer
http://localhost:8080/h2-console               → DB browser (dev only)
```

H2 console connection:
- JDBC URL: `jdbc:h2:mem:pizzadb`
- User: `sa` | Password: *(blank)*

### Step 4 — Start the frontend

```powershell
cd C:\Projects\PizzaMaker
npm start
```

Opens `http://localhost:3000`. The `cross-env NODE_OPTIONS=--openssl-legacy-provider` is baked into `package.json` — do not set it manually.

### Common first-run problems

| Symptom | Cause | Fix |
|---------|-------|-----|
| Backend fails: "DDL mismatch" or Flyway checksum error | Stale `target/` folder from a previous run | Delete `backend/target` and rerun |
| `npm install` peer dep errors | MUI v4 / React 18 version mismatch | Run `npm install --legacy-peer-deps` |
| Frontend shows "Network Error" on login | Backend not running, or wrong API URL | Check `.env`, confirm backend is on `:8080` |
| WebSocket "Live" dot grey/red | CORS mismatch | On localhost this should work; on deployed URLs see Bug #3 above |
| H2 console: table not found | Wrong JDBC URL | Use exactly `jdbc:h2:mem:pizzadb` — it's in-memory and tied to the app's process |
| Render free tier: first request hangs ~30s | Backend spun down after 15 min idle | Wait for cold start; subsequent requests are fast |

---

## How to Run — All Environments

### Local Dev — H2 (default, no cloud DB)

```powershell
# Terminal 1 — backend
cd C:\Projects\PizzaMaker\backend
C:\tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run

# Terminal 2 — frontend
cd C:\Projects\PizzaMaker
npm start
```

H2 data resets on every backend restart. No env vars required beyond `.env`.

---

### Local Dev — Neon PostgreSQL (persistent data)

```powershell
# Set env vars in PowerShell session before starting backend
$env:SPRING_PROFILES_ACTIVE = "prod"
$env:DATABASE_URL           = "jdbc:postgresql://ep-xxx.neon.tech/neondb?sslmode=require"
$env:DATABASE_USERNAME      = "your-neon-user"
$env:DATABASE_PASSWORD      = "your-neon-password"
$env:JWT_SECRET             = "your-base64-256bit-secret"
$env:JWT_EXPIRATION_MS      = "86400000"
$env:ALLOWED_ORIGINS        = "http://localhost:3000"

cd C:\Projects\PizzaMaker\backend
C:\tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

Frontend is unchanged — `npm start` as normal. Flyway migrations run once on first boot, then skip.

---

### Docker (local PostgreSQL, no cloud needed)

Fix `docker-compose.yml` secrets before using it — move hardcoded values to a `.env` file at project root:

```
# .env (gitignored)
POSTGRES_PASSWORD=yourpassword
JWT_SECRET=yourbase64secret
ALLOWED_ORIGINS=http://localhost:3000
```

Then:
```powershell
cd C:\Projects\PizzaMaker
docker-compose up --build
```

Backend on `:8080`, Postgres on `:5432`. Run frontend separately via `npm start`.

---

### Production — Render (backend) + Cloudflare Pages (frontend)

**Backend on Render:**

Set these in Render → Service → Environment:

| Key | Value |
|-----|-------|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DATABASE_URL` | Neon JDBC URL (`jdbc:postgresql://...`) |
| `DATABASE_USERNAME` | Neon username |
| `DATABASE_PASSWORD` | Neon password |
| `JWT_SECRET` | base64-encoded 256-bit secret (generate with `openssl rand -base64 32`) |
| `JWT_EXPIRATION_MS` | `86400000` |
| `ALLOWED_ORIGINS` | `https://your-app.pages.dev,https://your-custom-domain.com` |

**Frontend on Cloudflare Pages:**

Build settings:
- Build command: `npm run build`
- Output directory: `build`
- Node version: 18

Environment variable (Settings → Environment Variables):

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-render-service.onrender.com` |

**Important notes for production:**
- Render free tier spins down after 15 minutes of inactivity — first request after idle takes ~30 seconds cold start. WebSocket disconnects during spin-down and reconnects automatically (5s delay configured in `useOrderUpdates.js`).
- `ALLOWED_ORIGINS` must include every domain the frontend is served from, or CORS will block all API calls.
- WebSocket CORS (Bug #3) is currently hardcoded — until fixed, add your exact Pages domain to `WebSocketConfig.java` if it's not `*.pages.dev`.

---

## Deployment Strategy (Branches)

**Branch model to avoid uncontrolled production deployments:**

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

**Cloudflare Pages setup:**
- Production branch: `master`
- Preview branch: `develop` (gets its own `xxx.pages.dev` subdomain for QA before promoting)

**Render setup:**
- Auto-Deploy: enabled, branch: `master` only
- For manual control: disable auto-deploy and trigger from the Render dashboard after reviewing

This gives you: `feature → develop (preview/test) → manual promote to master (production)`.

---

## How to Use the App

### As a New Customer

**1. Sign Up**
- Click **Sign Up** (top right)
- Enter your name, email, password (min 6 chars)
- Inline errors appear if any field fails validation
- On success: toast "Account created! Welcome, {name}!" and redirected home

**2. Build Your Pizza**
- **Crust Size** (bottom left): choose Regular / Medium / Large
- **Base Topping** (bottom left): toggle Sauce, Mozzarella, Cheese
- **Toppings** (right panel): toggle Pepperoni / Sausage / Peppers / Olives
  - Choose **regular** or **medium** portion per topping
  - Topping cards highlight with a pop animation when selected
- **Estimated Total** (top left, below welcome): updates live as you customise

**3. Place Your Order**
- Click **Order** button (centre bottom)
  - Button is disabled if nothing is selected or you are not logged in
- Checkout page shows: pizza preview + ingredient summary
- Click **Order** on checkout → receipt modal appears:
  ```
  ✓ Order Placed!
  Order ID  #abc-123-...
  Size      M         ← ⚠ currently always M due to Bug #1
  Toppings  Pepperoni, Peppers
  Status    🕐 PENDING
  ```
- Choose **View Orders** or **Back to Menu**

**4. Track Your Order (Live)**
- Go to **Dashboard → Orders**
- Green pulsing **Live** dot in the header = WebSocket connected
- When admin updates your order status, the badge changes instantly:
  ```
  🕐 PENDING  →  ✅ CONFIRMED  →  👨‍🍳 PREPARING  →  📦 READY  →  🎉 DELIVERED
  ```
- A toast notification fires each time status changes

---

### As a Guest

- Click **Continue as Guest?** on the Login/Signup page
- Enter a name and email (no password required)
- You get a guest JWT token and can place orders just like a full user
- `userType` is shown as **Guest** (orange badge) on profile

---

### As an Admin

**Credentials:** `admin@pizzamaker.com` / `admin123`

**1.** Log in with admin credentials
**2.** Dashboard shows an extra **⚙ Admin** link in the sidebar
**3.** Admin Panel shows all orders across all users:

| Column | Description |
|--------|-------------|
| Order ID | Short UUID |
| Customer | Email — ⚠ currently always `—` due to Bug #4 |
| Size | R / M / L |
| Placed | Timestamp |
| Status | Coloured badge |
| Update | Dropdown to change status |

**4.** Change status via the dropdown — saves instantly, customer's browser updates live via WebSocket

---

## API Reference

> Full interactive docs at `http://localhost:8080/swagger-ui/index.html`

### Auth (public)
| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/v1/auth/register` | `{firstName, emailId, password}` | `AuthResponse` |
| POST | `/api/v1/auth/login` | `{emailId, password}` | `AuthResponse` |
| POST | `/api/v1/auth/guest` | `{firstName, emailId}` | `AuthResponse` |

`AuthResponse`: `{ token, type: "Bearer", uid, firstName, userType }`

### Users (authenticated)
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/v1/users/me` | `UserResponse` |

### Orders (authenticated)
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/v1/orders` | Place order — `OrderRequest` body |
| GET | `/api/v1/orders/my` | Your orders (paginated) |
| GET | `/api/v1/orders/{oid}` | Single order (owner only) |
| GET | `/api/v1/orders` | All orders — **ADMIN only** |
| PUT | `/api/v1/orders/{oid}/status` | Update status — **ADMIN only** |

### Menu (public)
| Method | Path | Response |
|--------|------|----------|
| GET | `/api/v1/menu/toppings` | List of toppings |
| GET | `/api/v1/menu/sizes` | `{ R: 8, M: 12, L: 16 }` |

### WebSocket
| Endpoint | Protocol | Notes |
|----------|----------|-------|
| `/ws` | SockJS/STOMP | Connect point |
| `/topic/orders` | STOMP subscribe | Receive `OrderStatusUpdate { oid, userUid, status }` |

---

## Database Setup (Neon)

1. Go to [neon.tech](https://neon.tech) → sign up free → **New Project** → name it `pizzamaker`
2. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Convert to JDBC format:
   ```
   jdbc:postgresql://ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Set environment variables (Render dashboard or local shell) with `prod` profile active
5. Flyway runs V1 + V2 migrations automatically on first boot

---

## Environment Variables

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | H2 (dev) | JDBC connection string |
| `DATABASE_USERNAME` | `sa` | DB user |
| `DATABASE_PASSWORD` | *(blank)* | DB password |
| `JWT_SECRET` | hardcoded dev key | Base64-encoded HMAC secret (min 32 bytes) — generate: `openssl rand -base64 32` |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24 hours) |
| `SPRING_PROFILES_ACTIVE` | default | Set to `prod` for PostgreSQL |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins for CORS |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend base URL — must be set in Cloudflare Pages environment for production builds |

Set in a `.env` file at project root (gitignored):
```
REACT_APP_API_URL=http://localhost:8080
```

---

## Commit History

| Commit | Description |
|--------|-------------|
| `dc0086f` | Real-time order tracking via WebSocket (STOMP + SockJS) |
| `7172c6c` | Upgrade to React 18 with createRoot API |
| `0a95269` | UI enhancements — toasts, price calc, orders, admin panel, animations |
| `b573aff` | Fix npm start — cross-env for OpenSSL compatibility |
| `ecc3062` | Wire React frontend to Spring Boot (Firebase → Axios) |
| `c32047a` | Add production-grade Spring Boot backend (45+ files) |

---

*Never push directly to `master`. Branch from `develop`, test, then promote via PR.*
