# PizzaMaker

Full-stack pizza ordering app with a **live, what-you-see-is-what-you-get pizza builder** — toppings drop onto the pie in real time as you customise, and the exact pizza you build is the one shown on your order confirmation and in your order history.

React + Vite frontend, Spring Boot REST backend.

![PizzaMaker live builder demo](docs/demo.gif)

See [ARCHITECTURE.md](ARCHITECTURE.md) for the deeper design write-up.

---

## Features

- **Live pizza builder** — an SVG pizza assembled in real time from your selections. Toppings are placed with a phyllotaxis (sunflower) distribution for an even, natural spread, and animate on/off the pie with Framer Motion as you toggle them.
- **WYSIWYG end to end** — the same `PizzaCanvas` renders the builder, the order-confirmation modal, and the order-history thumbnails, so what you build is exactly what you order and what you see served.
- **Auth** — standard accounts, guest checkout, and an admin role, all JWT-backed.
- **Live order status** — order updates pushed over STOMP/WebSocket and reflected in the UI without a refresh.
- **Resilient UI** — top-level error boundary and a styled 404 fallback instead of blank screens.

---

## Architecture

```
Browser
  │
  └── React 18 (Redux Toolkit · Vite · react-hot-toast)
        │
        ▼  HTTP / REST
  ┌─────────────────────────────────────────────────────┐
  │              Spring Boot API  (port 8080)           │
  │                                                     │
  │  AuthController  OrderController  MenuController    │
  │        │               │               │           │
  │        └───────────────┴───────────────┘           │
  │                        │                           │
  │              Service Layer (business logic)        │
  │       AuthService  OrderService  MenuService       │
  │                        │                           │
  │              Repository Layer (Spring Data JPA)    │
  │          UserRepository    OrderRepository         │
  │                        │                           │
  │              ┌──────────────────┐                  │
  │              │  H2 (dev/test)   │                  │
  │              │  PostgreSQL (prod)│                  │
  │              └──────────────────┘                  │
  │                                                     │
  │  Cross-cutting: JWT Filter · GlobalExceptionHandler │
  │                 Flyway · Actuator · Swagger UI      │
  └─────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Redux Toolkit |
| Animation | Framer Motion (SVG pizza rendering) |
| Build tool | Vite 5 |
| Frontend tests | Vitest |
| Language (backend) | Java 21 |
| Framework | Spring Boot 3.3.5 |
| Security | Spring Security 6 + JWT (jjwt 0.12.3) |
| Persistence | Spring Data JPA + Hibernate |
| DB (dev) | H2 in-memory |
| DB (prod) | PostgreSQL 16 |
| Migrations | Flyway |
| API Docs | springdoc-openapi 2.6 / Swagger UI |
| Observability | Spring Boot Actuator |
| Async | `@Async` with `ThreadPoolTaskExecutor` |
| Build | Maven + Maven Wrapper |
| Tests | JUnit 5 + Mockito + MockMvc |
| CI | GitHub Actions |
| Containers | Docker |

---

## Prerequisites

- **Java 21** — [Eclipse Temurin](https://adoptium.net/) recommended
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)
- Maven is bundled via the wrapper (`mvnw.cmd`) — no install needed

---

## How to Run Locally

### 1. Clone and set up env

```bash
git clone https://github.com/udaykt/PizzaMaker.git
cd PizzaMaker
cp .env.example .env          # already pre-filled for local dev
```

### 2. Start the backend (Spring Boot + H2)

Open a terminal in the `backend/` folder:

```bash
# Windows (PowerShell)
cd backend
.\mvnw.cmd spring-boot:run

# macOS / Linux
cd backend
./mvnw spring-boot:run
```

Wait for the line:
```
Started PizzaMakerApplication in X seconds
```

Available at:
- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console  (JDBC URL: `jdbc:h2:mem:pizzadb`)
- Health: http://localhost:8080/actuator/health

### 3. Start the frontend (Vite dev server)

Open a **second** terminal in the project root:

```bash
npm install
npm run dev
```

App opens at **http://localhost:3000**

---

## Run tests

**Backend** (JUnit 5 + Mockito):

```bash
cd backend
.\mvnw.cmd test     # Windows (PowerShell)
./mvnw test         # macOS / Linux
```

**Frontend** (Vitest — placement engine, order mapping, store reducers):

```bash
npm test            # run once
npm run test:watch  # watch mode
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | Public | Register standard user, returns JWT |
| POST | `/api/v1/auth/login` | Public | Login, returns JWT |
| POST | `/api/v1/auth/guest` | Public | Register guest user, returns JWT |
| GET | `/api/v1/menu/toppings` | Public | List available toppings |
| GET | `/api/v1/menu/sizes` | Public | List sizes with pricing |
| GET | `/api/v1/users/me` | User | Get current user profile |
| POST | `/api/v1/orders` | User | Place a new order |
| GET | `/api/v1/orders/my` | User | Get own orders (paginated) |
| GET | `/api/v1/orders/{oid}` | User | Get specific order |
| GET | `/api/v1/orders` | Admin | Get all orders (paginated) |
| PUT | `/api/v1/orders/{oid}/status` | Admin | Update order status |
| GET | `/actuator/health` | Public | Health check |

Pagination params: `?page=0&size=10&sort=createdAt,desc`

---

## Design Patterns

| Pattern | Where | Why |
|---|---|---|
| **Repository** | `UserRepository`, `OrderRepository` | Decouples data access from business logic; easy to swap DB |
| **DTO / Mapper** | `*Request`, `*Response`, `UserMapper`, `OrderMapper` | Prevents entity leakage to API layer; stable API contract |
| **Chain of Responsibility** | Spring Security filter chain → `JwtAuthenticationFilter` | Each filter handles one concern, passes to next |
| **Strategy** | `PasswordEncoder` (BCrypt injected via DI) | Swap hashing algorithm without changing callers |
| **Facade** | `AuthService` (wraps repo + JWT + encoder) | Single entry point hides multi-step auth flow |
| **Decorator** | `@Async` on `NotificationService` | Adds async behaviour without modifying business logic |
| **Template Method** | `OncePerRequestFilter` in `JwtAuthenticationFilter` | Framework calls `doFilterInternal`; subclass fills the step |

---

## Security Notes

- Passwords are BCrypt-hashed and only the hash is stored — the app never persists plaintext credentials.
- JWT secret must be a Base64-encoded 256-bit key in production (set via `JWT_SECRET` env var).
- The dev secret in `application.yml` is for local use only — never commit a real secret.
- Guest users have `null` password hash; they authenticate only via JWT (no password endpoint).
