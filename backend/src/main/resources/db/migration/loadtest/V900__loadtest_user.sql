-- Load-test fixture. NOT part of the normal migration set.
--
-- This file lives in its own Flyway location (db/migration/loadtest) which is
-- only on spring.flyway.locations when the `loadtest` profile is active — see
-- application-loadtest.yml. A plain `prod` or default boot never sees it, so the
-- account cannot leak into a real deployment by accident.
--
-- Seeds one CUSTOMER-equivalent account for k6-order-load.js:
--   emailId  loadtest@pizzamaker.com
--   password loadtest123
--
-- The codebase has no CUSTOMER role. Role is {ROLE_USER, ROLE_ADMIN} and
-- UserType is {STANDARD, GUEST, ADMIN}; a customer is ROLE_USER + STANDARD,
-- which is exactly what AuthService.register() creates. That combination is
-- used here so the load test exercises the same authorities a real customer has
-- (POST /api/v1/orders falls under anyRequest().authenticated(), never an admin
-- matcher).
--
-- The hash is BCrypt (strength 10) of "loadtest123", generated with the same
-- BCryptPasswordEncoder the app configures in SecurityConfig.
--
-- Guarded with NOT EXISTS so it is safe against a database that already has the
-- row (e.g. re-pointed at a Postgres that survived a previous run) and portable
-- across H2 and PostgreSQL.
INSERT INTO users (uid, first_name, email_id, password_hash, user_type, role, created_at, updated_at)
SELECT '00000000-0000-4000-8000-00000000load',
       'Loadtest',
       'loadtest@pizzamaker.com',
       '$2a$10$As4qg4qR2kC0oYuj7LYjbeetvQ7BuUmudEhw.FnX3Mx.zY0qEwEpq',
       'STANDARD',
       'ROLE_USER',
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email_id = 'loadtest@pizzamaker.com'
);
