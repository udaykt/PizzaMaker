# PizzaMaker

Full-stack pizza ordering app — React + Firebase frontend, production-grade Spring Boot REST backend.

---

## Architecture

```
Browser
  │
  └── React UI (Redux Toolkit · Material-UI · Firebase Auth)
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
| Language | Java 21 |
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
| Containers | Docker + Docker Compose |

---

## How to Run Locally

### Option 1 — Dev mode (H2, no Docker)

```bash
cd backend
./mvnw spring-boot:run          # Windows: .\mvnw.cmd spring-boot:run
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console  (JDBC URL: `jdbc:h2:mem:pizzadb`)
- Actuator: http://localhost:8080/actuator/health

### Option 2 — Full stack with PostgreSQL (Docker Compose)

```bash
# Build the jar first
cd backend && ./mvnw package -DskipTests && cd ..

# Start everything
docker-compose up --build
```

### Run tests

```bash
cd backend
./mvnw test
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

## 10 FAANG Interview Questions

**1. Why JWT over sessions for this API?**
JWT is stateless — the server holds no session state, making it trivially horizontally scalable. Each request carries a self-contained, signed token. Trade-off: tokens can't be invalidated before expiry without a blocklist (Redis), which we'd add in a production system.

**2. How does Spring Security's filter chain work here?**
`JwtAuthenticationFilter` runs before `UsernamePasswordAuthenticationFilter`. It extracts the Bearer token, validates it, loads `UserDetails`, and sets the `SecurityContext`. Downstream filters and controllers see an authenticated principal — no session involved.

**3. Why Flyway instead of `ddl-auto: create`?**
Flyway gives deterministic, versioned, auditable schema migrations that run in order (`V1__`, `V2__`). `ddl-auto: create` destroys data on restart and can silently diverge between environments. Production databases must never be managed by Hibernate's DDL tool.

**4. Walk me through placing an order end-to-end.**
`POST /api/v1/orders` → `JwtAuthenticationFilter` validates token → `OrderController.placeOrder` called with `@AuthenticationPrincipal` → `@Valid` checks `@NotNull pizzaSize` → `OrderService.placeOrder` loads user, builds `Order`, saves, fires `@Async` notification → returns `OrderResponse` DTO (entity never leaves service layer).

**5. How did you handle concurrent order placement safely?**
`@Transactional` on `placeOrder` wraps the save in a single DB transaction. For true high-concurrency (e.g., seat reservation), we'd add an optimistic lock (`@Version`) on the entity to detect concurrent modifications without blocking reads.

**6. What's the difference between `@Mock` and `@MockBean` in your tests?**
`@Mock` (Mockito) creates a plain mock — no Spring context, used in `@ExtendWith(MockitoExtension)` unit tests for pure logic. `@MockBean` replaces a Spring bean in the full application context during `@SpringBootTest` — right for controller tests where the full filter chain and MVC config must be live.

**7. How would you scale this to 10,000 orders/second?**
(1) Stateless JWT means any node handles any request — add instances behind a load balancer. (2) Move order writes to an async queue (Kafka `order.placed` topic) so the HTTP response returns immediately. (3) Read replicas for `GET /orders`. (4) Cache menu endpoints with Redis. (5) Connection pooling with HikariCP (already Spring Boot default).

**8. Why `@Transactional(readOnly = true)` on query methods?**
Signals Hibernate to skip dirty-checking on entities loaded in that session (no snapshot needed), and lets the DB driver/replica route to a read replica. Small wins per query; significant at scale.

**9. How would you revoke a JWT before it expires?**
Store a `token_version` counter per user in the DB (or Redis). Embed it in the JWT claim on issue. In `JwtAuthenticationFilter`, verify the claim matches current DB value. Incrementing `token_version` on logout/password-change instantly invalidates all existing tokens for that user.

**10. What's wrong with the original Firebase implementation you replaced?**
Plaintext passwords were stored in Firestore documents — a critical OWASP A02 (Cryptographic Failures) violation. Any Firestore rules misconfiguration would have exposed all credentials in plaintext. The new backend BCrypt-hashes passwords, stores only the hash, and removes the entire client-side auth bypass surface.

---

## Security Notes

- JWT secret must be a Base64-encoded 256-bit key in production (set via `JWT_SECRET` env var).
- The dev secret in `application.yml` is for local use only — never commit a real secret.
- Guest users have `null` password hash; they authenticate only via JWT (no password endpoint).
