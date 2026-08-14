// Load test for the order-placement path: authenticate once, then hammer
// POST /api/v1/orders and read each created order back.
//
// Everything below is pinned to the real contracts in backend/:
//   login        POST /api/v1/auth/login   {emailId, password}   (AuthController + LoginRequest)
//   token field  AuthResponse.token        (NOT accessToken/jwt) — send as "Bearer <token>"
//   order body   OrderRequest              (pizzaSize is the only required field)
//   topping ids  must be an ACTIVE code in the topping table, else OrderService 400s
//
// Run:
//   k6 run k6-order-load.js
//   BASE_URL=http://localhost:8080 VUS=20 DURATION=1m k6 run k6-order-load.js
//
// No remote imports: this runs on an air-gapped box and never pulls jslib.

import http from 'k6/http';
import { check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = (__ENV.BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const EMAIL = __ENV.LOADTEST_EMAIL || 'loadtest@pizzamaker.com';
const PASSWORD = __ENV.LOADTEST_PASSWORD || 'loadtest123';
const READ_BACK = __ENV.READ_BACK !== '0';

const ordersPlaced = new Counter('orders_placed');
const orderSuccess = new Rate('order_success');
const orderDuration = new Trend('order_place_duration', true);

export const options = {
  scenarios: {
    place_orders: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.RAMP_UP || '20s', target: Number(__ENV.VUS || 20) },
        { duration: __ENV.DURATION || '1m', target: Number(__ENV.VUS || 20) },
        { duration: __ENV.RAMP_DOWN || '10s', target: 0 },
      ],
      gracefulRampDown: '15s',
    },
  },
  thresholds: {
    // Placement is the SLO that matters; the read-back is along for the ride.
    'http_req_failed{endpoint:place_order}': ['rate<0.01'],
    'http_req_duration{endpoint:place_order}': ['p(95)<800', 'p(99)<2000'],
    order_success: ['rate>0.99'],
    checks: ['rate>0.99'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// k6 has no crypto.randomUUID. This only needs to be collision-free within a
// run, since it is the Idempotency-Key and the unique index on
// orders.idempotency_key is what actually enforces dedup.
function idempotencyKey(runId) {
  return `k6-${runId}-${__VU}-${__ITER}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Between 0 and 3 distinct toppings, drawn from the catalog the server says is
// active. Sending an id the topping table doesn't have is a 400, not a load
// signal, so the codes are never hardcoded here.
function pickToppings(codes) {
  const quantities = ['LIGHT', 'REGULAR', 'EXTRA'];
  const count = Math.floor(Math.random() * 4);
  const pool = [...codes];
  const chosen = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push({ id: pool.splice(idx, 1)[0], quantity: pick(quantities) });
  }
  return chosen;
}

// Exactly the shape of com.pizzamaker.dto.request.OrderRequest. Field names and
// enum constants are the Java ones — Jackson binds them verbatim.
function buildOrderRequest(toppingCodes) {
  return {
    pizzaName: `k6 load ${__VU}-${__ITER}`.slice(0, 40), // @Size(max = 40)
    sauceType: pick(['NONE', 'ROBUST_TOMATO', 'MARINARA', 'GARLIC_PARMESAN', 'ALFREDO', 'BBQ']),
    mozzarella: Math.random() < 0.8,
    cheddar: Math.random() < 0.3,
    parmesanAsiago: Math.random() < 0.2,
    feta: Math.random() < 0.1,
    ricotta: Math.random() < 0.1,
    veganCheese: Math.random() < 0.05,
    toppings: pickToppings(toppingCodes),
    pizzaSize: pick(['R', 'M', 'L']), // @NotNull — the one field that must be present
    crustStyle: pick(['THIN', 'HAND_TOSSED', 'STUFFED']),
    bakeLevel: pick(['NORMAL', 'WELL_DONE']),
    deliveryMethod: pick(['DELIVERY', 'CARRYOUT']),
  };
}

// Runs once, on one VU, before the test. Authenticating here rather than per-VU
// is not just an optimisation: AuthRateLimitFilter allows 10 requests per minute
// per IP to /api/v1/auth/**, so a login inside default() would 429 the moment
// the ramp passes 10 VUs and the test would measure the rate limiter instead of
// the order path.
export function setup() {
  const toppingsRes = http.get(`${BASE_URL}/api/v1/menu/toppings`);
  if (toppingsRes.status !== 200) {
    throw new Error(
      `GET /api/v1/menu/toppings returned ${toppingsRes.status}. Is the API up at ${BASE_URL}?`
    );
  }
  const toppingCodes = toppingsRes.json().map((t) => t.code);
  if (toppingCodes.length === 0) {
    throw new Error('Topping catalog is empty — did the V18 migration run?');
  }

  let res = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ emailId: EMAIL, password: PASSWORD }),
    { headers: JSON_HEADERS }
  );

  // The seed migration only runs under the `loadtest` profile. When the target
  // wasn't started with it (a stock minikube runs SPRING_PROFILES_ACTIVE=prod),
  // fall back to the public register endpoint, which creates the same
  // ROLE_USER / STANDARD account the migration does.
  if (res.status === 401) {
    console.warn(`${EMAIL} not found — registering it via /api/v1/auth/register`);
    res = http.post(
      `${BASE_URL}/api/v1/auth/register`,
      JSON.stringify({ firstName: 'Loadtest', emailId: EMAIL, password: PASSWORD }),
      { headers: JSON_HEADERS }
    );
  }

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Auth failed: ${res.status} ${res.body}`);
  }

  // AuthResponse is {token, type, uid, firstName, userType}.
  const token = res.json('token');
  if (!token) {
    throw new Error(`No "token" in auth response: ${res.body}`);
  }

  return {
    token,
    toppingCodes,
    runId: `${Date.now().toString(36)}`,
  };
}

export default function (data) {
  const authHeaders = {
    ...JSON_HEADERS,
    Authorization: `Bearer ${data.token}`,
  };

  let oid = null;

  group('place order', () => {
    const res = http.post(`${BASE_URL}/api/v1/orders`, JSON.stringify(buildOrderRequest(data.toppingCodes)), {
      headers: {
        ...authHeaders,
        // Unique per iteration. Reusing a key would make OrderService return the
        // first order instead of writing a new one, and the test would silently
        // stop measuring inserts.
        'Idempotency-Key': idempotencyKey(data.runId),
      },
      tags: { endpoint: 'place_order' },
    });

    const ok = check(
      res,
      {
        'place order -> 201': (r) => r.status === 201,
        'response has oid': (r) => !!r.json('oid'),
        'price is positive': (r) => Number(r.json('price')) > 0,
      },
      { endpoint: 'place_order' }
    );

    orderSuccess.add(ok);
    orderDuration.add(res.timings.duration);
    if (ok) {
      ordersPlaced.add(1);
      oid = res.json('oid');
    } else if (res.status !== 201) {
      console.error(`POST /api/v1/orders -> ${res.status}: ${res.body}`);
    }
  });

  if (READ_BACK && oid) {
    group('read order back', () => {
      const res = http.get(`${BASE_URL}/api/v1/orders/${oid}`, {
        headers: authHeaders,
        tags: { endpoint: 'get_order' },
      });
      check(
        res,
        {
          'get order -> 200': (r) => r.status === 200,
          'line items present': (r) => Array.isArray(r.json('lineItems')) && r.json('lineItems').length > 0,
        },
        { endpoint: 'get_order' }
      );
    });
  }
}

// Writes a machine-readable summary next to the script and prints the numbers
// worth reading to stdout. Defining this replaces k6's built-in end-of-test
// report, so the essentials are re-printed by hand.
export function handleSummary(data) {
  const m = data.metrics;
  const n = (metric, stat, digits = 2) => {
    const v = metric && metric.values ? metric.values[stat] : undefined;
    return typeof v === 'number' ? v.toFixed(digits) : 'n/a';
  };

  const failures = Object.entries(m)
    .filter(([, metric]) => metric.thresholds)
    .flatMap(([name, metric]) =>
      Object.entries(metric.thresholds)
        .filter(([, t]) => !t.ok)
        .map(([expr]) => `${name} ${expr}`)
    );

  const lines = [
    '',
    '  PizzaMaker order load test',
    `  target            ${BASE_URL}`,
    `  orders placed     ${n(m.orders_placed, 'count', 0)}`,
    `  order success     ${n(m.order_success, 'rate' , 4)}`,
    `  checks passed     ${n(m.checks, 'rate', 4)}`,
    `  http reqs         ${n(m.http_reqs, 'count', 0)}  (${n(m.http_reqs, 'rate')}/s)`,
    `  http failed       ${n(m.http_req_failed, 'rate', 4)}`,
    `  place p50/p95/p99 ${n(m.order_place_duration, 'med')} / ${n(m.order_place_duration, 'p(95)')} / ${n(m.order_place_duration, 'p(99)')} ms`,
    `  place max         ${n(m.order_place_duration, 'max')} ms`,
    '',
    failures.length === 0
      ? '  THRESHOLDS PASSED'
      : `  THRESHOLDS FAILED\n${failures.map((f) => `    - ${f}`).join('\n')}`,
    '',
  ];

  return {
    stdout: lines.join('\n'),
    'k6-summary.json': JSON.stringify(data, null, 2),
  };
}
