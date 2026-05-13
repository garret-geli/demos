// ── Auth configuration ────────────────────────────────────
const AUTH_URL = 'https://demos-worker.garret-blocher.workers.dev';

const AUTH_KEYS = {
  access: 'auth_access_token',
  id: 'auth_id_token',
  refresh: 'auth_refresh_token',
};

// ── Helpers ───────────────────────────────────────────────
function isAuthenticated() {
  return !!sessionStorage.getItem(AUTH_KEYS.access);
}

function showApp() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showAuthOverlay() {
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'flex';
  const pwdField = document.getElementById('auth-password');
  if (pwdField) pwdField.value = '';
}

function setAuthError(msg) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'block' : 'none';
}

function setAuthLoading(loading) {
  const btn = document.getElementById('auth-submit');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Signing in…' : 'Sign In';
}

// ── Login ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const userId = document.getElementById('auth-userid').value.trim();
  const password = document.getElementById('auth-password').value;

  setAuthError('');
  setAuthLoading(true);

  try {
    const res = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientType: 'User', id: userId, password }),
    });

    if (res.status === 401 || res.status === 403) {
      setAuthError('Invalid credentials. Please try again.');
      return;
    }
    if (res.status === 404) {
      setAuthError('Authentication endpoint not found (404).');
      return;
    }
    if (!res.ok) {
      setAuthError(`Authentication failed (${res.status}).`);
      return;
    }

    let body;
    try {
      body = await res.json();
    } catch {
      setAuthError('Authentication response was not valid JSON.');
      return;
    }

    if (!body.accessToken) {
      setAuthError('Login succeeded but no access token was returned.');
      return;
    }

    sessionStorage.setItem(AUTH_KEYS.access, body.accessToken);
    if (body.idToken) sessionStorage.setItem(AUTH_KEYS.id, body.idToken);
    if (body.refreshToken) sessionStorage.setItem(AUTH_KEYS.refresh, body.refreshToken);

    showApp();
  } catch (err) {
    setAuthError('Unable to reach authentication service. Please try again.');
  } finally {
    setAuthLoading(false);
  }
}

// ── Logout ────────────────────────────────────────────────
function logout() {
  Object.values(AUTH_KEYS).forEach((k) => sessionStorage.removeItem(k));
  showAuthOverlay();
}

// ── Bootstrap ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  if (isAuthenticated()) {
    showApp();
  }
  const form = document.getElementById('auth-form');
  if (form) form.addEventListener('submit', handleLogin);
});
