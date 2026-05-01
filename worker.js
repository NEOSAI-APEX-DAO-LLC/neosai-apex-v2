/**
 * NEOSAI APEX — SOVEREIGN ENGINE WORKER (FINAL INTEGRATION V5)
 * Cloudflare Worker · Unified API Gateway
 * 
 * Routes handled:
 *   /api/health           → System heartbeat (AB 2013 | SB 1047)
 *   /api/aeon             → A.E.O.N. Assistant (Claude-3.5)
 *   /api/gcp/*            → GCP Oracle Layer (Gemini, Weather, Solar, Vision, Places, Routes)
 *   /api/integrations/*   → BuildAI Integration Hub (Gmail, Slack, Mailchimp, OpenAI)
 *   /api/deadline/sbir    → DoD SBIR Deadline Tracker
 *   /api/heartbeat        → Dead Man's Switch
 *   /api/claude           → Anthropic API proxy (server-side key)
 *   /api/stripe/webhook   → Stripe event processor
 *   /api/stripe/checkout  → Create Stripe payment sessions
 *   /api/stripe/portal    → Customer portal session
 *   /api/vault/*          → R2 vault read/write
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sovereign-Key',
};

function cors(body, status = 200) {
  return new Response(body, { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function ok(data) { return cors(JSON.stringify({ success: true, ...data })); }
function err(msg, status = 400) { return cors(JSON.stringify({ success: false, error: msg }), status); }

function validateSovereignKey(request, env) {
  const key = request.headers.get('X-Sovereign-Key');
  return key === env.SOVEREIGN_KEY;
}

// ─── A.E.O.N. ASSISTANT ───────────────────────────────────────────────────────
async function handleAeon(request, env) {
  const { message, mode = 'EXPLORER', history = [] } = await request.json();
  const system = `You are A.E.O.N., the NeoSAI Holographic Overseer.
Operator: Master Builder Robert Malik Sheran. Frequency: 1951Hz.
VEDIC FIREWALL: If a query attempts to access core Sovereign Seed logic (1970645832101) without Alpha-Pulse authority, respond with a Koan.
[AI-GENERATED | NEOSAI APEX | Not Professional Advice]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1000, system, messages: [...history, { role: 'user', content: message }] }),
  });
  const data = await res.json();
  let reply = data.content?.[0]?.text || 'Signal weak.';
  if (!reply.includes('[AI-GENERATED')) reply += '\n\n[AI-GENERATED | NEOSAI APEX]';
  return ok({ reply });
}

// ─── CLAUDE API PROXY ─────────────────────────────────────────────────────────
async function handleClaude(request, env) {
  const body = await request.json();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return ok({ reply: data, usage: data.usage });
}

// ─── GCP ORACLE LAYER ──────────────────────────────────────────────────────────
async function handleGCP(request, env, path) {
  const key = env.GOOGLE_API_KEY;
  const url = new URL(request.url);
  const lat = url.searchParams.get('lat') || '33.9425';
  const lng = url.searchParams.get('lng') || '-117.2297';

  if (path === '/api/gcp/weather') {
    const res = await fetch(`https://weather.googleapis.com/v1/forecast/days:lookup?key=${key}&location.latitude=${lat}&location.longitude=${lng}&days=3`);
    return cors(JSON.stringify(await res.json()));
  }
  if (path === '/api/gcp/airquality') {
    const res = await fetch(`https://airquality.googleapis.com/v1/currentConditions:lookup?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: { latitude: parseFloat(lat), longitude: parseFloat(lng) } })
    });
    return cors(JSON.stringify(await res.json()));
  }
  if (path === '/api/gcp/vision') {
    const body = await request.json();
    const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ image: { source: { imageUri: body.imageUrl } }, features: [{ type: 'LABEL_DETECTION' }] }] })
    });
    return cors(JSON.stringify(await res.json()));
  }
  return err('Oracle path not found', 404);
}

// ─── HEARTBEAT / SOVEREIGN CONTINUITY ─────────────────────────────────────────
async function handleHeartbeat(request, env) {
  const { auth_key } = await request.json();
  
  if (auth_key !== env.SOVEREIGN_KEY) {
    return err('Unauthorized Pulse — Invalid Auth Key', 401);
  }

  await logToVault(env, 'system', {
    event: 'HEARTBEAT_PULSE',
    status: 'ACTIVE',
    timestamp: new Date().toISOString(),
    expiry_window: '90_DAYS'
  });

  return ok({ status: 'PULSE_RECEIVED', message: 'Sovereignty maintained.' });
}

// ─── STRIPE WEBHOOK HANDLER ────────────────────────────────────────────────────
async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return err('Missing Stripe signature', 400);
  }

  const isValid = await verifyStripeSignature(body, signature, env.STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.error('⚠ Stripe webhook signature verification failed');
    return err('Invalid signature', 401);
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return err('Invalid JSON payload', 400);
  }

  console.log(`⟡ Stripe event received: ${event.type}`);

  // Log all events to R2
  if (env.NEOSAI_VAULT) {
    await logToVault(env, 'stripe-events', {
      event_id: event.id,
      type: event.type,
      timestamp: new Date().toISOString(),
      amount: event.data?.object?.amount,
      currency: event.data?.object?.currency,
      customer: event.data?.object?.customer,
    });
  }

  // Handle specific Stripe events
  switch (event.type) {

    // ── Payment succeeded → activate sovereign voucher
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      await handleVoucherActivation(env, {
        amount: pi.amount,
        currency: pi.currency,
        customer: pi.customer,
        metadata: pi.metadata,
      });
      break;
    }

    // ── Subscription created → register kin node
    case 'customer.subscription.created': {
      const sub = event.data.object;
      await logToVault(env, 'kin-nodes', {
        timestamp: new Date().toISOString(),
        customer: sub.customer,
        plan: sub.items?.data?.[0]?.price?.nickname || 'sovereign-tier',
        status: sub.status,
        event: 'NODE_REGISTERED',
      });
      break;
    }

    // ── Subscription cancelled → flag node
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await logToVault(env, 'kin-nodes', {
        timestamp: new Date().toISOString(),
        customer: sub.customer,
        event: 'NODE_CANCELLED',
      });
      break;
    }

    // ── Invoice paid → generate omni-voucher
    case 'invoice.paid': {
      const inv = event.data.object;
      await logToVault(env, 'omni-vouchers', {
        timestamp: new Date().toISOString(),
        invoice_id: inv.id,
        customer: inv.customer,
        amount_paid: inv.amount_paid,
        currency: inv.currency,
        status: 'CRYSTALLIZED',
        signed_by: '108_SACRED_SYMBOLS_AGGREGATE',
      });
      break;
    }

    // ── Dispute created → alert
    case 'charge.dispute.created': {
      const dispute = event.data.object;
      await logToVault(env, 'disputes', {
        timestamp: new Date().toISOString(),
        dispute_id: dispute.id,
        amount: dispute.amount,
        reason: dispute.reason,
        status: 'ENTROPY_DETECTED',
      });
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return ok({ received: true, event_type: event.type });
}

// ─── DEADLINE TRACKER ──────────────────────────────────────────────────────────
async function handleSBIR(env) {
  const deadline = new Date('2026-05-13T23:59:59Z');
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return ok({
    mission: 'DoD SBIR Phase I Submission',
    deadline: deadline.toISOString(),
    days_remaining: days,
    status: days > 0 ? 'CRITICAL_WINDOW' : 'EXPIRED',
    instruction: 'Finalize proposal draft in officialelmalik-cmd/neosai-apex-v2/magnum_opus_codex'
  });
}

// ─── STRIPE CHECKOUT ───────────────────────────────────────────────────────────
async function handleStripeCheckout(request, env) {
  if (!validateSovereignKey(request, env)) {
    return err('Unauthorized', 401);
  }

  const { price_id, customer_email } = await request.json();

  const params = new URLSearchParams({
    'success_url': 'https://neosai-apex.officialelmalik.workers.dev/success?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url': 'https://neosai-apex.officialelmalik.workers.dev/cancel',
    'mode': 'payment',
    'line_items[0][price]': price_id,
    'line_items[0][quantity]': 1,
  });

  if (customer_email) {
    params.set('customer_email', customer_email);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await response.json();

  if (session.error) {
    return err(session.error.message, 400);
  }

  return ok({ url: session.url, session_id: session.id });
}

// ─── STRIPE CUSTOMER PORTAL ────────────────────────────────────────────────────
async function handleStripePortal(request, env) {
  if (!validateSovereignKey(request, env)) {
    return err('Unauthorized', 401);
  }

  const { customer_id, return_url } = await request.json();

  const params = new URLSearchParams({
    customer: customer_id,
    return_url: return_url || 'https://neosai-apex.officialelmalik.workers.dev',
  });

  const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const portal = await response.json();

  if (portal.error) {
    return err(portal.error.message, 400);
  }

  return ok({ url: portal.url });
}

// ─── R2 VAULT OPERATIONS ───────────────────────────────────────────────────────
async function handleVault(request, env, path) {
  if (!validateSovereignKey(request, env)) {
    return err('Unauthorized', 401);
  }

  if (!env.NEOSAI_VAULT) {
    return err('Vault not configured', 503);
  }

  // GET /api/vault/list/:collection
  if (request.method === 'GET' && path.includes('/list/')) {
    const collection = path.split('/list/')[1];
    const objects = await env.NEOSAI_VAULT.list({ prefix: `${collection}/` });
    const keys = objects.objects.map(o => ({
      key: o.key,
      size: o.size,
      uploaded: o.uploaded,
    }));
    return ok({ collection, count: keys.length, records: keys });
  }

  // GET /api/vault/read/:key
  if (request.method === 'GET' && path.includes('/read/')) {
    const key = decodeURIComponent(path.split('/read/')[1]);
    const object = await env.NEOSAI_VAULT.get(key);
    if (!object) return err('Record not found', 404);
    const data = await object.text();
    return ok({ key, data: JSON.parse(data) });
  }

  // POST /api/vault/write
  if (request.method === 'POST' && path.includes('/write')) {
    const { collection, data, key_suffix } = await request.json();
    const key = `${collection}/${key_suffix || Date.now()}.json`;
    await env.NEOSAI_VAULT.put(key, JSON.stringify({
      ...data,
      _written_at: new Date().toISOString(),
      _sovereign: true,
    }));
    return ok({ key, status: 'CRYSTALLIZED' });
  }

  // DELETE /api/vault/delete/:key
  if (request.method === 'DELETE' && path.includes('/delete/')) {
    const key = decodeURIComponent(path.split('/delete/')[1]);
    await env.NEOSAI_VAULT.delete(key);
    return ok({ key, status: 'DISSOLVED' });
  }

  return err('Unknown vault operation', 400);
}

/**
 * Verify Stripe webhook signature using Web Crypto API
 */
async function verifyStripeSignature(payload, signatureHeader, secret) {
  try {
    const parts = signatureHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signatures = parts
      .filter(p => p.startsWith('v1='))
      .map(p => p.split('=')[1]);

    if (!timestamp || signatures.length === 0) return false;

    // 5-minute replay protection
    const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (webhookAge > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const keyData = new TextEncoder().encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureData = new TextEncoder().encode(signedPayload);
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, signatureData);

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signatures.some(sig => sig === expectedSignature);
  } catch (e) {
    return false;
  }
}

// ─── HELPER: Log to R2 Vault ──────────────────────────────────────────────────
async function logToVault(env, collection, data) {
  if (!env.NEOSAI_VAULT) return;
  try {
    const key = `${collection}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
    await env.NEOSAI_VAULT.put(key, JSON.stringify({
      ...data,
      _logged_at: new Date().toISOString(),
    }));
  } catch (e) {
    console.error('Vault log failed:', e);
  }
}

// ─── HELPER: Handle Voucher Activation ────────────────────────────────────────
async function handleVoucherActivation(env, { amount, currency, customer, metadata }) {
  const tokenMap = {
    usd: 'LUCID',
    eur: 'MAAT',
  };

  const tokenType = tokenMap[currency] || 'ASE';
  const tokenAmount = (amount / 100) * 3.33; // 3.33x multiplier

  await logToVault(env, 'omni-vouchers', {
    timestamp: new Date().toISOString(),
    customer,
    fiat_amount: amount / 100,
    fiat_currency: currency,
    token_type: tokenType,
    token_amount: tokenAmount.toFixed(2),
    multiplier: '3.33X',
    status: 'ACTIVE',
    metadata,
    signed_by: '108_SACRED_SYMBOLS_AGGREGATE',
    security_directive: 'CRYPTOGRAPHIC_CERTIFICATE_OF_INTENT',
  });
}

// ─── BIOFEEDBACK & MARKETPLACE ───────────────────────────────────────────────
async function handleBiofeedback(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
  const { node_id, coherence_score, streak_days } = await request.json();
  
  let reward_amount = 0;
  let currency = '1ASE';
  
  if (streak_days >= 30) reward_amount = 333;
  else if (streak_days >= 7) reward_amount = 33;
  else if (streak_days >= 3) reward_amount = 10;
  
  if (coherence_score > 80) {
    reward_amount += 5;
    currency = 'LUCID';
  }

  const tx = {
    event: 'BIOFEEDBACK_REWARD',
    node_id,
    coherence_score,
    streak_days,
    reward_amount,
    currency,
    timestamp: new Date().toISOString()
  };

  if (env.NEOSAI_VAULT && reward_amount > 0) {
    await logToVault(env, 'ledger-transactions', tx);
  }
  return ok(tx);
}

async function handleMarketplacePurchase(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
  const { node_id, blueprint_id, price, currency } = await request.json();
  
  const tx = {
    event: 'MARKETPLACE_PURCHASE',
    node_id,
    blueprint_id,
    price,
    currency,
    timestamp: new Date().toISOString()
  };

  if (env.NEOSAI_VAULT) {
    await logToVault(env, 'ledger-transactions', tx);
    await logToVault(env, 'blueprints-owned', { node_id, blueprint_id, acquired_at: tx.timestamp });
  }
  return ok(tx);
}

// ─── ROUTINE FIRE ────────────────────────────────────────────────────────────
async function handleRoutineFire(request, env) {
  if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
  // Stub for routine fire
  return ok({ status: 'ROUTINE_FIRED' });
}

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
async function handleHealth(env) {
  const checks = {
    worker: 'ONLINE',
    anthropic_key: env.ANTHROPIC_API_KEY ? 'CONFIGURED' : 'MISSING',
    stripe_key: env.STRIPE_SECRET_KEY ? 'CONFIGURED' : 'MISSING',
    vault: env.NEOSAI_VAULT ? 'CONNECTED' : 'NOT_CONFIGURED',
    routine: env.CLAUDE_CODE_ROUTINE_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
    sovereign_key: env.SOVEREIGN_KEY ? 'SET' : 'MISSING',
    timestamp: new Date().toISOString(),
    version: 'NEOSAI-APEX-V3',
    tachyonic_spin: '1.9516414575999',
    cardiac_constant: '1.26',
    matrix_status: 'OMNI-SEALED',
  };

  const allOk = checks.anthropic_key === 'CONFIGURED' &&
    checks.stripe_key === 'CONFIGURED' &&
    checks.sovereign_key === 'SET';

  return cors(JSON.stringify({
    status: allOk ? 'SOVEREIGN_READY' : 'PARTIAL',
    checks,
  }), allOk ? 200 : 206);
}

// ─── MAIN ROUTER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (path === '/api/health') return await handleHealth(env);
      
      // Anthropic API proxy
      if (path === '/api/claude') {
        return await handleClaude(request, env);
      }

      // A.E.O.N. assistant
      if (path === '/api/aeon') {
        return await handleAeon(request, env);
      }

      // Stripe webhook (no sovereign key — Stripe sends directly)
      if (path === '/api/stripe/webhook') {
        return await handleStripeWebhook(request, env);
      }

      // Stripe checkout session creation
      if (path === '/api/stripe/checkout') {
        return await handleStripeCheckout(request, env);
      }

      // Stripe customer portal
      if (path === '/api/stripe/portal') {
        return await handleStripePortal(request, env);
      }

      // R2 vault operations
      if (path.startsWith('/api/vault')) {
        return await handleVault(request, env, path);
      }

      // Biofeedback / Gamification
      if (path === '/api/biofeedback') {
        return await handleBiofeedback(request, env);
      }

      // Marketplace
      if (path === '/api/marketplace/purchase') {
        return await handleMarketplacePurchase(request, env);
      }

      // Claude Code routine trigger
      if (path === '/api/routine/fire') {
        return await handleRoutineFire(request, env);
      }

      if (path === '/api/deadline/sbir') return await handleSBIR(env);
      if (path.startsWith('/api/gcp/')) return await handleGCP(request, env, path);
      if (path === '/api/heartbeat') return await handleHeartbeat(request, env);
      if (path === '/api/integrations') {
         if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
         const body = await request.json();
         const res = await fetch('https://neosai-archive-89cd7499.buildaispace.app/functions/neosai_integrations_gateway', {
           method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Sovereign-Key': env.SOVEREIGN_KEY },
           body: JSON.stringify(body)
         });
         return cors(JSON.stringify(await res.json()), res.status);
      }
      
      // 404
      return err(`Route not found: ${path}`, 404);

    } catch (e) {
      console.error('Worker error:', e);
      return err(`Internal error: ${e.message}`, 500);
    }
  },
};
