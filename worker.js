/**
 * NEOSAI APEX — SOVEREIGN ENGINE WORKER (FINAL INTEGRATION V5)
 * Cloudflare Worker · Unified API Gateway
 * 
 * Routes:
 *   /api/health           → System heartbeat (AB 2013 | SB 1047)
 *   /api/aeon             → A.E.O.N. Assistant (Claude-3.5)
 *   /api/gcp/*            → GCP Oracle Layer (Gemini, Weather, Solar, Vision, Places, Routes)
 *   /api/integrations/*   → BuildAI Integration Hub (Gmail, Slack, Mailchimp, OpenAI)
 *   /api/deadline/sbir    → DoD SBIR Deadline Tracker
 *   /api/heartbeat        → Dead Man's Switch
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

// ─── MAIN ROUTER ──────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    try {
      if (path === '/api/health') return ok({ status: 'SOVEREIGN_READY', frequency: '1951Hz', compliance: 'LOCKED' });
      if (path === '/api/aeon') return await handleAeon(request, env);
      if (path === '/api/deadline/sbir') return await handleSBIR(env);
      if (path.startsWith('/api/gcp/')) return await handleGCP(request, env, path);
      if (path === '/api/integrations') {
         if (!validateSovereignKey(request, env)) return err('Unauthorized', 401);
         const body = await request.json();
         const res = await fetch('https://neosai-archive-89cd7499.buildaispace.app/functions/neosai_integrations_gateway', {
           method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Sovereign-Key': env.SOVEREIGN_KEY },
           body: JSON.stringify(body)
         });
         return cors(JSON.stringify(await res.json()), res.status);
      }
      return err('Route not found', 404);
    } catch (e) { return err(e.message, 500); }
  }
};
