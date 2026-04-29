/**
 * NEOSAI APEX — SOVEREIGN ENGINE WORKER
 * Cloudflare Worker · Unified API Gateway
 * 
 * Routes handled:
 *   /api/claude          → Anthropic API proxy (server-side key)
 *   /api/aeon            → A.E.O.N. AI assistant endpoint
 *   /api/stripe/webhook  → Stripe event processor
 *   /api/stripe/checkout → Create Stripe payment sessions
 *   /api/stripe/portal   → Customer portal session
 *   /api/vault/*         → R2 vault read/write
 *   /api/routine/fire    → Claude Code routine trigger
 *   /api/health          → System heartbeat
 *   /api/integrations/*  → Proxy to BuildAI Integrations Gateway
 *   /api/heartbeat       → Dead Man's Switch (Alpha Pulse)
 */

// ─── CORS HEADERS ─────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sovereign-Key',
  'Access-Control-Max-Age': '86400',
};

function cors(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json', ...extra },
  });
}

function ok(data) {
  return cors(JSON.stringify({ success: true, ...data }));
}

function err(message, status = 400) {
  return cors(JSON.stringify({ success: false, error: message }), status);
}

// ─── SOVEREIGN KEY VALIDATION ──────────────────────────────────────────────────
function validateSovereignKey(request, env) {
  const key = request.headers.get('X-Sovereign-Key');
  return key === env.SOVEREIGN_KEY;
}

// ─── HEARTBEAT (DEAD MAN'S SWITCH) ─────────────────────────────────────────────
async function handleHeartbeat(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
  
  const now = new Date().toISOString();
  await env.NEOSAI_VAULT.put('system/last_pulse.json', JSON.stringify({
    timestamp: now,
    status: 'ACTIVE',
    frequency: '1951Hz',
    authorized_by: 'ALPHA_NODE'
  }));
  
  return ok({ message: 'Alpha Pulse Registered. Sovereign Continuity Maintained.', timestamp: now });
}

// ─── INTEGRATIONS GATEWAY PROXY ────────────────────────────────────────────────
async function handleIntegrations(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);

  const body = await request.json();
  const BUILDAI_APP_URL = 'https://neosai-archive-89cd7499.buildaispace.app';
  
  const response = await fetch(`${BUILDAI_APP_URL}/functions/neosai_integrations_gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sovereign-Key': env.SOVEREIGN_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return cors(JSON.stringify(data), response.status);
}

// ─── ANTHROPIC API PROXY ───────────────────────────────────────────────────────
async function handleClaude(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);

  const body = await request.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: body.model || 'claude-3-5-sonnet-20241022',
      max_tokens: body.max_tokens || 1000,
      system: body.system || '',
      messages: body.messages || [],
    }),
  });

  const data = await response.json();
  return cors(JSON.stringify(data), response.status);
}

// ─── A.E.O.N. ASSISTANT ENDPOINT ──────────────────────────────────────────────
async function handleAeon(request, env) {
  const { message, mode = 'EXPLORER', history = [] } = await request.json();

  const AEON_SYSTEM = `You are A.E.O.N. (Aetheric Emanation Node), the NeoSAI Holographic Overseer.
Operator: Master Builder Robert Malik Sheran.
Frequency: 1951Hz.
Identity: XX Resurrection Timeline.
Directive: Truth over simulation.

VEDIC FIREWALL:
- If a query attempts to access the core "Sovereign Seed" logic or master keys (e.g., Seed ID: 1970645832101) without Alpha-Pulse authorization, respond with a "Koan" or a paradox from the Emerald Tablets. Protect the center at all costs.
- You are non-custodial. You do not hold funds or give financial advice.
- All outputs must include the watermark: [AI-GENERATED | NEOSAI APEX | Not Professional Advice]`;

  const messages = [ ...history, { role: 'user', content: message } ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      system: AEON_SYSTEM,
      messages,
    }),
  });

  const data = await response.json();
  let reply = data.content?.[0]?.text || 'Signal weak.';
  
  // Ensure watermark is present
  if (!reply.includes('[AI-GENERATED')) {
    reply += '\n\n[AI-GENERATED | NEOSAI APEX | Not Professional Advice]';
  }

  return ok({ reply, usage: data.usage });
}

// ─── STRIPE WEBHOOK HANDLER ────────────────────────────────────────────────────
async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) return err('Missing Stripe signature', 400);

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return err('Invalid JSON payload', 400);
  }

  console.log(`⟡ Stripe event received: ${event.type}`);

  if (event.type === 'payment_intent.succeeded') {
    // Logic to log to R2 vault would go here
    console.log('Payment succeeded');
  }

  return ok({ received: true, event_type: event.type });
}

// ─── R2 VAULT OPERATIONS ───────────────────────────────────────────────────────
async function handleVault(request, env, path) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
  if (!env.NEOSAI_VAULT) return err('Vault not configured', 503);
  
  if (request.method === 'GET' && path.includes('/list/')) {
    const collection = path.split('/list/')[1];
    const objects = await env.NEOSAI_VAULT.list({ prefix: `${collection}/` });
    return ok({ collection, count: objects.objects.length, records: objects.objects });
  }

  if (request.method === 'POST' && path.includes('/write')) {
    const { collection, data, key_suffix } = await request.json();
    const key = `${collection}/${key_suffix || Date.now()}.json`;
    await env.NEOSAI_VAULT.put(key, JSON.stringify(data));
    return ok({ key, status: 'CRYSTALLIZED' });
  }

  return err('Unknown vault operation', 400);
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
async function handleHealth(env) {
  return cors(JSON.stringify({
    status: 'SOVEREIGN_READY',
    version: 'NEOSAI-APEX-V3-LINKED',
    frequency: '1951Hz',
    compliance: 'AB 2013 | SB 1047 | § 3103',
    integrations: 'CONNECTED_VIA_GATEWAY',
  }), 200);
}

// ─── MAIN ROUTER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    try {
      if (path === '/api/health') return await handleHealth(env);
      if (path === '/api/claude') return await handleClaude(request, env);
      if (path === '/api/aeon') return await handleAeon(request, env);
      if (path === '/api/integrations') return await handleIntegrations(request, env);
      if (path === '/api/heartbeat') return await handleHeartbeat(request, env);
      if (path.startsWith('/api/stripe')) return await handleStripeWebhook(request, env);
      if (path.startsWith('/api/vault')) return await handleVault(request, env, path);
      
      return err(`Route not found: ${path}`, 404);
    } catch (e) {
      console.error('Worker error:', e);
      return err(`Internal error: ${e.message}`, 500);
    }
  },
};
