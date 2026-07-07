// Single source of truth for the backend base URL.
//
// Resolution order:
//   1. VITE_API_URL (build-time env) — always wins if set. Set it in Cloudflare
//      Pages if your deployed backend lives at a different URL, no code change.
//   2. localhost in local dev (served from localhost/127.0.0.1).
//   3. Otherwise the deployed Render API (production default).
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = host === 'localhost' || host === '127.0.0.1';

export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? 'http://localhost:8080' : 'https://pizzamaker-api.onrender.com');
