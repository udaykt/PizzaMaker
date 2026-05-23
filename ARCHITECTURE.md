# PizzaMaker — Architecture, Flow & Usage Guide

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
8. [How to Run Locally](#how-to-run-locally)
9. [How to Use the App](#how-to-use-the-app)
10. [API Reference](#api-reference)
11. [Database Setup (Neon)](#database-setup-neon)
12. [Environment Variables](#environment-variables)
13. [Commit History](#commit-history)

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
    pizzaSize: "M" }
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
├── backend/                          ← Spring Boot 3 API
│   ├── pom.xml
│   └── src/main/java/com/pizzamaker/
│       ├── config/
│       │   ├── AsyncConfig.java
│       │   ├── DataSeeder.java       ← seeds admin user on startup
│       │   ├── OpenApiConfig.java
│       │   ├── SecurityConfig.java   ← JWT + CORS + role rules
│       │   └── WebSocketConfig.java  ← STOMP broker
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── MenuController.java
│       │   ├── OrderController.java
│       │   └── UserController.java
│       ├── dto/
│       │   ├── request/              ← LoginRequest, RegisterRequest, OrderRequest …
│       │   └── response/             ← AuthResponse, OrderResponse, OrderStatusUpdate …
│       ├── entity/
│       │   ├── Order.java
│       │   ├── OrderStatus.java      ← PENDING→CONFIRMED→PREPARING→READY→DELIVERED
│       │   ├── User.java
│       │   └── UserType.java         ← STANDARD | GUEST | ADMIN
│       ├── mapper/
│       │   ├── OrderMapper.java
│       │   └── UserMapper.java
│       ├── repository/
│       │   ├── OrderRepository.java
│       │   └── UserRepository.java
│       ├── security/
│       │   ├── JwtAuthenticationFilter.java
│       │   ├── JwtTokenProvider.java
│       │   └── UserDetailsServiceImpl.java
│       └── service/
│           ├── AuthService.java
│           ├── MenuService.java
│           ├── NotificationService.java
│           └── OrderService.java
│
├── src/                              ← React 18 frontend
│   ├── api/axiosClient.js            ← Axios + JWT interceptor
│   ├── hooks/useOrderUpdates.js      ← STOMP WebSocket hook
│   ├── store/                        ← Redux Toolkit slices
│   │   ├── index.js
│   │   ├── menuSlice.js              ← pricing state
│   │   ├── orderSlice.js
│   │   ├── pizzahubSlice.js          ← pizza customisation state
│   │   ├── uiSlice.js
│   │   └── userSlice.js
│   ├── containers/
│   │   ├── Admin/AdminPanel.js       ← admin dashboard
│   │   ├── Checkout/Checkout.js
│   │   ├── Firebase/
│   │   │   ├── Auth.js              ← login/signup/guest/logout
│   │   │   └── Firebase.js          ← createOrder/fetchOrders/fetchUser/pricing
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
├── docker-compose.yml                ← PostgreSQL + backend
├── package.json
└── README.md
```

---

## How to Run Locally

### Prerequisites
- Java 21 (Eclipse Temurin recommended)
- Maven 3.9+ at `C:\tools\apache-maven-3.9.9\` (or on PATH)
- Node.js 18+
- npm 8+

### Step 1 — Start the Backend

```powershell
cd C:\Projects\PizzaMaker\backend

# Windows PowerShell
C:\tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

Backend starts on **http://localhost:8080**

On first start, Flyway runs migrations and `DataSeeder` creates:
```
admin@pizzamaker.com  /  admin123  (ROLE_ADMIN)
```

Verify it's up:
```
http://localhost:8080/actuator/health   → { "status": "UP" }
http://localhost:8080/swagger-ui/index.html  → full API docs
http://localhost:8080/h2-console  → DB browser (dev only)
```

H2 console settings:
- JDBC URL: `jdbc:h2:mem:pizzadb`
- User: `sa`  |  Password: *(blank)*

### Step 2 — Start the Frontend

```powershell
cd C:\Projects\PizzaMaker
npm start
```

React starts on **http://localhost:3000**

> `cross-env NODE_OPTIONS=--openssl-legacy-provider` is baked into `package.json` scripts — no manual env var needed.

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
  Size      M
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

**5. Your Profile**
- Go to **Dashboard → My Profile**
- Shows your name, email, account badge (Standard / Guest / Admin)
- Shortcut to My Orders
- Logout button

---

### As a Guest

- Click **Continue as Guest?** on the Login/Signup page
- Enter a name and email (no password required)
- You get a guest JWT token and can place orders just like a full user
- `userType` is shown as **Guest** (orange badge) on profile

---

### As an Admin

**Credentials:** `admin@pizzamaker.com` / `admin123`

**1. Log in** with admin credentials  
**2. Dashboard** shows an extra **⚙ Admin** link in the sidebar  
**3. Admin Panel** shows all orders across all users:

| Column | Description |
|--------|-------------|
| Order ID | Short UUID |
| Customer | Email (from orderResponse) |
| Size | R / M / L |
| Placed | Timestamp |
| Status | Coloured badge |
| Update | Dropdown to change status |

**4. Change status** via the dropdown — saves instantly, customer's browser updates live via WebSocket

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

1. Go to [neon.tech](https://neon.tech) → sign up free → **New Project** → name it `pizza-maker`
2. Copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Convert to JDBC format:
   ```
   jdbc:postgresql://ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Set environment variables when running backend with prod profile:
   ```powershell
   $env:SPRING_PROFILES_ACTIVE = "prod"
   $env:DATABASE_URL = "jdbc:postgresql://..."
   $env:DATABASE_USERNAME = "your-neon-user"
   $env:DATABASE_PASSWORD = "your-neon-password"
   $env:JWT_SECRET = "your-base64-secret-min-32-chars"
   C:\tools\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
   ```
5. Flyway runs V1 + V2 migrations automatically on first boot

---

## Environment Variables

### Backend
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | H2 (dev) | JDBC connection string |
| `DATABASE_USERNAME` | `sa` | DB user |
| `DATABASE_PASSWORD` | *(blank)* | DB password |
| `JWT_SECRET` | hardcoded dev key | Base64-encoded HMAC secret (min 32 bytes) |
| `JWT_EXPIRATION_MS` | `86400000` | Token lifetime (24 hours) |
| `SPRING_PROFILES_ACTIVE` | default | Set to `prod` for PostgreSQL |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `http://localhost:8080` | Backend base URL |

Set in a `.env` file at project root:
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

*Branch: `feature/spring-boot-backend` — raise a PR to merge into `master`*
