/**
 * Cloudflare Worker — shared CORS proxy for demos repo.
 *
 * Proxies browser auth requests to apigateway.geli.net, which does not
 * set Access-Control-Allow-Origin headers itself. All apps in this repo
 * that need authenticated API access should point their AUTH_URL at the
 * deployed URL of this worker.
 *
 * Upstream target:
 *   https://apigateway.geli.net/authserv/authentication/api/v1/login
 *
 * Deploy via Cloudflare → Workers & Pages → Connect to Git:
 *   - Repository : garret-blocher/demos  (or your org/demos)
 *   - Entry point: worker.js
 *   - Branch     : main (auto-deploys on push)
 *
 * After deploying, copy the *.workers.dev URL and set it as AUTH_URL in
 * each app's auth.js:
 *   const AUTH_URL = 'https://your-worker.workers.dev';
 *
 * To restrict which origins may call this worker, replace '*' below with
 * your actual origins, e.g.:
 *   new Set(['https://your-org.github.io', 'http://localhost:8080'])
 */

const UPSTREAM_URL =
  'https://apigateway.geli.net/authserv/authentication/api/v1/login';

const ALLOWED_ORIGINS = new Set(['*']);

function corsHeaders(requestOrigin) {
  const allow =
    ALLOWED_ORIGINS.has('*') || ALLOWED_ORIGINS.has(requestOrigin)
      ? requestOrigin || '*'
      : '';

  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin') || '';

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders(origin),
      });
    }

    let body;
    try {
      body = await request.text();
    } catch {
      return new Response('Bad request body', {
        status: 400,
        headers: corsHeaders(origin),
      });
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(UPSTREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Upstream unreachable', detail: String(err) }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        },
      );
    }

    const responseBody = await upstreamResponse.text();

    return new Response(responseBody, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type':
          upstreamResponse.headers.get('Content-Type') || 'application/json',
        ...corsHeaders(origin),
      },
    });
  },
};
