# demos

Static web demos deployed via GitHub Pages and embedded in Confluence pages as iframes.
Each app is plain HTML/CSS/JS — no build step, no framework.

---

## Repo structure

```
demos/
├── worker.js              # Shared Cloudflare Worker — CORS proxy for auth
├── wrangler.jsonc         # Cloudflare Worker config
├── predict/
│   └── storage-sizing-enhancements/
│       ├── index.html
│       ├── app.js
│       ├── auth.js        # Auth gate — copy this to every new app
│       └── styles.css
└── insight/               # Future apps live here
```

---

## Architecture

```
Browser (GitHub Pages / Confluence iframe)
        │
        │  POST credentials
        ▼
Cloudflare Worker  ← adds CORS headers
        │
        │  POST server-to-server (no CORS)
        ▼
apigateway.geli.net/authserv/.../login
        │
        └─ returns { accessToken, idToken, refreshToken }
```

**Why the worker is needed:** `apigateway.geli.net` was built for server-to-server calls and doesn't set `Access-Control-Allow-Origin` headers. Browsers block direct `fetch()` calls from a web page to any endpoint missing those headers. The Cloudflare Worker sits in between — the browser calls it, it forwards to the gateway (server-to-server, no CORS restrictions), and it staples the required headers onto the response. The gateway itself never needs to change.

**Why `sessionStorage`:** Tokens are scoped to the tab/iframe lifetime. When a Confluence page is closed, tokens are gone and the next visit requires a fresh login. No persistent credentials sitting in `localStorage`.

---

## Adding auth to a new app

1. **Copy `auth.js`** from an existing app into the new app's folder. `AUTH_URL` at the top already points at the deployed worker — no changes needed.

2. **Add to `index.html`:**
   - In `<head>`: `<script src="auth.js"></script>` (before `app.js`)
   - First element in `<body>`: the auth overlay `<div id="auth-overlay">...</div>` (copy from an existing app)
   - In the header: `<button class="signout-btn" onclick="logout()">Sign out</button>`

3. **Add to `styles.css`:** copy the `/* ── Auth Overlay */` and `/* ── Sign-out button */` blocks from an existing app.

That's it. The overlay shows on load if no token is present, hides on successful login, and reappears on sign out.

---

## Cloudflare Worker

`worker.js` at the repo root is deployed once and shared by all apps. It auto-redeploys on every push to `main` via the Cloudflare → Workers & Pages → Git integration.

**First-time deploy (already done — for reference):**
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Connect to Git**
2. Select this repo, name it `demos-worker`, entry point `worker.js`, branch `main`
3. Deployed URL: `https://demos-worker.garret-blocher.workers.dev`

**To restrict which origins can call the worker** (recommended once GitHub Pages URL is set):
```js
// worker.js
const ALLOWED_ORIGINS = new Set([
  'https://garret-geli.github.io',
  'http://localhost:8080',
]);
```

---

## Local development

Never open `index.html` directly — browsers send origin `null` from `file://` URLs, which the worker rejects. Always use a local server:

```bash
cd predict/storage-sizing-enhancements
python3 -m http.server 8080
# open http://localhost:8080
```
