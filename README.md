# demos

Static web demos deployed via GitHub Pages, intended to be embedded in Confluence pages as iframes.

---

## Repo structure

```
demos/
├── worker.js              # Shared Cloudflare Worker (CORS proxy — see below)
├── predict/
│   └── storage-sizing-enhancements/
│       ├── index.html
│       ├── app.js
│       ├── auth.js        # Auth gate (shared pattern — see below)
│       └── styles.css
└── insight/               # Future apps live here
```

---

## Auth pattern

Each app is gated behind a login screen backed by the company auth service at:

```
https://apigateway.geli.net/authserv/authentication/api/v1/login
```

### How it works

1. On load, `auth.js` checks `sessionStorage` for an existing `auth_access_token`.
2. If none is found, a fullscreen login overlay is shown over the app.
3. On form submit, a `POST` is sent to `AUTH_URL` (the Cloudflare Worker proxy — see below) with:
   ```json
   { "clientType": "User", "id": "<user-id>", "password": "<password>" }
   ```
4. On success, `accessToken`, `idToken`, and `refreshToken` are stored in `sessionStorage`.
5. The overlay is hidden and the app renders normally.
6. A **Sign out** button in the header clears `sessionStorage` and re-shows the overlay.

`sessionStorage` is scoped per tab/iframe, so each Confluence page load requires a fresh sign-in. This is intentional — no persistent tokens.

### Adding auth to a new app

1. Copy `auth.js` from an existing app into the new app's folder.
2. Make sure `AUTH_URL` at the top of `auth.js` points to the deployed Cloudflare Worker URL.
3. Add to `index.html`:
   - `<script src="auth.js"></script>` in `<head>` (before `app.js`)
   - The auth overlay markup before the main content (copy from an existing `index.html`)
   - A **Sign out** button in the header: `<button class="signout-btn" onclick="logout()">Sign out</button>`
4. Add auth + sign-out styles to `styles.css` (copy the `/* ── Auth Overlay */` and `/* ── Sign-out button */` blocks from an existing app).

---

## Cloudflare Worker (CORS proxy)

### Why it exists

The auth endpoint does not set `Access-Control-Allow-Origin` headers, so browsers block direct `fetch()` calls from a GitHub Pages origin. The worker sits in between: the browser calls the worker, the worker calls the gateway server-to-server (no CORS restrictions), and the worker adds the required CORS headers to its response.

### worker.js — repo root

`worker.js` at the repo root is the single shared proxy for all apps in this repo. It handles:
- `OPTIONS` preflight requests
- `POST` forwarding to the upstream auth endpoint
- CORS headers on every response

### Deployment (Cloudflare Workers — GitHub integration)

1. Log in to [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages** → **Create** → **Worker** → **Connect to Git**
3. Select this repository (`demos`)
4. Set the **entry point** to `worker.js`
5. Set the **branch** to `main` — Cloudflare will redeploy automatically on every push that touches `worker.js`
6. After the first deploy, copy the assigned `*.workers.dev` URL

### After deploying

Set `AUTH_URL` in every app's `auth.js` to the worker URL:

```js
const AUTH_URL = 'https://your-worker.workers.dev';
```

### Locking down allowed origins (optional but recommended)

By default the worker accepts requests from any origin (`'*'`). Once the GitHub Pages URL is known, restrict it in `worker.js`:

```js
const ALLOWED_ORIGINS = new Set([
  'https://your-org.github.io',
  'http://localhost:8080', // for local dev
]);
```

---

## Local development

Serve any app with a local HTTP server (required — opening `index.html` directly as a `file://` URL causes browsers to send origin `null`, which the worker rejects):

```bash
cd predict/storage-sizing-enhancements
python3 -m http.server 8080
# open http://localhost:8080
```
