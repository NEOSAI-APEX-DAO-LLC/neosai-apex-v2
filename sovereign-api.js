/**
 * NEOSAI APEX — Sovereign API Client
 * 
 * All API calls route through the Cloudflare Worker proxy.
 * The ANTHROPIC_API_KEY and STRIPE_SECRET_KEY never touch the frontend.
 * 
 * Usage:
 *   import api from './sovereign-api';
 *   const reply = await api.aeon.ask("What is the state of the Sovereign Engine?");
 *   const session = await api.stripe.checkout({ price_id: 'price_xxx' });
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const WORKER_URL = import.meta.env?.VITE_WORKER_URL ||
  'https://neosai-apex.officialelmalik.workers.dev';

const SOVEREIGN_KEY = import.meta.env?.VITE_SOVEREIGN_KEY || '';

// ─── BASE REQUEST ─────────────────────────────────────────────────────────────
async function request(path, options = {}) {
  const { body, method = 'POST', requiresAuth = true } = options;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth && SOVEREIGN_KEY) {
    headers['X-Sovereign-Key'] = SOVEREIGN_KEY;
  }

  const response = await fetch(`${WORKER_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// ─── A.E.O.N. API ─────────────────────────────────────────────────────────────
export const aeon = {
  /**
   * Send a message to A.E.O.N.
   * @param {string} message - User message
   * @param {string} mode - SPARK | EXPLORER | ARCHITECT
   * @param {Array} history - Previous conversation turns
   */
  async ask(message, mode = 'EXPLORER', history = []) {
    return request('/api/aeon', {
      body: { message, mode, history },
    });
  },
};

// ─── CLAUDE PROXY ─────────────────────────────────────────────────────────────
export const claude = {
  /**
   * Send a message to Claude via the secure worker proxy
   * @param {Object} params - Standard Anthropic message params
   */
  async message(params) {
    return request('/api/claude', { body: params });
  },

  /**
   * Engineer a prompt for image generation
   */
  async engineerPrompt(subject, style, camera, mood, extra = '') {
    return request('/api/claude', {
      body: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: 'You are the NEOSAI APEX Cinematic Anime Prompt Engineer. Output ONLY the final prompt string. Max 200 words. End with: anime key visual, masterpiece, best quality, 8k',
        messages: [{
          role: 'user',
          content: `Subject: ${subject}\nStyle: ${style}\nCamera: ${camera}\nMood: ${mood}\nExtra: ${extra}\n\nEngineer the optimal prompt:`,
        }],
      },
    });
  },
};

// ─── STRIPE API ───────────────────────────────────────────────────────────────
export const stripe = {
  /**
   * Create a Stripe Checkout session
   * Maps to: 333 Cubed Exchange "Transmute Asset" button
   */
  async checkout({ price_id, customer_email, mode = 'payment', metadata = {} }) {
    return request('/api/stripe/checkout', {
      body: {
        price_id,
        customer_email,
        mode,
        metadata: {
          source: 'neosai-333-exchange',
          ...metadata,
        },
        success_url: `${window.location.origin}?payment=success`,
        cancel_url: `${window.location.origin}?payment=cancelled`,
      },
    });
  },

  /**
   * Open Stripe Customer Portal
   * Maps to: Sovereign Voucher self-serve management
   */
  async portal(customer_id) {
    return request('/api/stripe/portal', {
      body: {
        customer_id,
        return_url: window.location.href,
      },
    });
  },
};

// ─── VAULT API ────────────────────────────────────────────────────────────────
export const vault = {
  /**
   * List records in a vault collection
   */
  async list(collection) {
    return request(`/api/vault/list/${collection}`, { method: 'GET' });
  },

  /**
   * Read a specific vault record
   */
  async read(key) {
    return request(`/api/vault/read/${encodeURIComponent(key)}`, { method: 'GET' });
  },

  /**
   * Write a record to the vault
   */
  async write(collection, data, key_suffix) {
    return request('/api/vault/write', {
      body: { collection, data, key_suffix },
    });
  },

  /**
   * Delete a vault record
   */
  async remove(key) {
    return request(`/api/vault/delete/${encodeURIComponent(key)}`, { method: 'DELETE' });
  },

  /**
   * Log a Kinship Registry entry
   */
  async registerKin(kin) {
    return vault.write('kin-registry', {
      ...kin,
      registered_at: new Date().toISOString(),
      node_status: 'ACTIVE',
    });
  },

  /**
   * Log an Omni-Ranch beast to the vault
   */
  async anchorBeast(beast) {
    return vault.write('omni-ranch', {
      ...beast,
      anchored_at: new Date().toISOString(),
      syntropy: 100,
    });
  },
};

// ─── ROUTINE API ──────────────────────────────────────────────────────────────
export const routine = {
  /**
   * Fire A.E.O.N. Claude Code routine with context
   */
  async fire(text) {
    return request('/api/routine/fire', { body: { text } });
  },
};

// ─── SOVEREIGNTY API ──────────────────────────────────────────────────────────
export const sovereignty = {
  /**
   * Send a Heartbeat Pulse to maintain active status.
   * Required every 90 days per the Sovereign Continuity Protocol.
   */
  async sendPulse(auth_key) {
    return request('/api/heartbeat', {
      body: { auth_key },
    });
  },
};

// ─── MARKETPLACE & BIOFEEDBACK ────────────────────────────────────────────────
export const economy = {
  /**
   * Submit biofeedback for resonance rewards
   */
  async submitBiofeedback(node_id, coherence_score, streak_days) {
    return request('/api/biofeedback', {
      body: { node_id, coherence_score, streak_days },
    });
  },

  /**
   * Buy a blueprint from the Omni-Tech Exchange
   */
  async buyBlueprint(node_id, blueprint_id, price, currency) {
    return request('/api/marketplace/purchase', {
      body: { node_id, blueprint_id, price, currency },
    });
  },
};

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
export const health = {
  async check() {
    const response = await fetch(`${WORKER_URL}/api/health`);
    return response.json();
  },
};

// ─── DEFAULT EXPORT ───────────────────────────────────────────────────────────
const api = { aeon, claude, stripe, vault, routine, sovereignty, health, economy };
export default api;
