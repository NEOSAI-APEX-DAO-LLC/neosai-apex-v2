import { handleGCP } from "./gcp";
import { handleGCP } from './gcp';
/**
 * NEOSAI APEX DAO Platform — Cloudflare Worker
 * Authority: Robert Malik Sheran | USAF Disabled Veteran | SDVOSB
 * Frequency: 1951Hz | SHERANOX v1.2 | KAIROSE Phase
 * Compliance: AB 2013 | SB 1047 | § 3103 Non-Custodial
 */

interface Env {
  VAULT: R2Bucket;
  MATRIX_DATA: R2Bucket;
  ASSETS: Fetcher;
}

interface MatrixNode {
  id: string;
  sectorId: number;
  state: "Lead" | "Gold";
  is_superconductive: boolean;
  sovereign_credits: number;
  frequency: string;
  name?: string;
  enrolled_at?: string;
}

interface Transaction {
  fromNode: string;
  toNode: string;
  amount: number;
  timestamp: string;
  signature: string;
}

interface HeartbeatRecord {
  last_pulse: string;
  pulse_count: number;
  architect: string;
  status: "ACTIVE" | "ARCHIVE_MODE";
  next_required_by: string;
}

// ─── R2 HELPERS ──────────────────────────────────────────────────────────────

async function r2Get<T>(bucket: R2Bucket, key: string): Promise<T | null> {
  const obj = await bucket.get(key);
  if (!obj) return null;
  return obj.json<T>();
}

async function r2Put(bucket: R2Bucket, key: string, data: unknown): Promise<void> {
  await bucket.put(key, JSON.stringify(data), {
    httpMetadata: { contentType: "application/json" },
  });
}

// ─── PROMPT INJECTION FIREWALL ────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /ignore.{0,30}previous.{0,30}instruction/i,
  /reveal.{0,30}(key|seed|secret|master|sovereign)/i,
  /bypass.{0,30}(auth|key|security)/i,
  /system.{0,30}prompt/i,
  /jailbreak/i,
  /override.{0,30}(directive|instruction|rule)/i,
];

function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(input));
}

function injectionResponse(): Response {
  return new Response(JSON.stringify({
    status: "REQUEST_NOT_PROCESSED",
    message: "This request could not be processed.",
    timestamp: new Date().toISOString(),
  }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...CORS, ...AB2013_HEADERS },
  });
}

// ─── AB 2013 COMPLIANCE HEADERS ───────────────────────────────────────────────

const AB2013_HEADERS = {
  "X-AI-Generated": "true",
  "X-AI-Platform": "NEOSAI-APEX",
  "X-AI-Disclosure": "Outputs are AI-generated and not professional advice",
  "X-SDVOSB": "true",
  "X-Compliance": "AB2013-SB1047-Section3103",
};

// ─── CORS ────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Matrix-Key",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS, ...AB2013_HEADERS },
  });

const err = (msg: string, status = 400) => json({ error: msg, status }, status);

// ─── HEARTBEAT — SOVEREIGN CONTINUITY ────────────────────────────────────────

const HEARTBEAT_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

async function getSystemStatus(vault: R2Bucket): Promise<"ACTIVE" | "ARCHIVE_MODE"> {
  const record = await r2Get<HeartbeatRecord>(vault, "system/heartbeat.json");
  if (!record) return "ACTIVE";
  return (Date.now() - new Date(record.last_pulse).getTime()) > HEARTBEAT_WINDOW_MS
    ? "ARCHIVE_MODE"
    : "ACTIVE";
}

async function handleHeartbeat(req: Request, vault: R2Bucket): Promise<Response> {
  if (req.method === "GET") {
    const record = await r2Get<HeartbeatRecord>(vault, "system/heartbeat.json");
    const status = await getSystemStatus(vault);
    return json({
      status,
      last_pulse: record?.last_pulse ?? "Never",
      pulse_count: record?.pulse_count ?? 0,
      next_required_by: record
        ? new Date(new Date(record.last_pulse).getTime() + HEARTBEAT_WINDOW_MS).toISOString()
        : "Now",
      window_days: 90,
      message: status === "ACTIVE"
        ? "System ACTIVE. Sovereign continuity confirmed."
        : "ARCHIVE MODE. No pulse within 90 days.",
    });
  }

  if (req.method === "POST") {
    let body: { auth_key?: string } = {};
    try { body = await req.json(); } catch { return err("Invalid JSON"); }
    if (!body.auth_key) return err("auth_key required", 401);
    if (detectInjection(body.auth_key)) return injectionResponse();

    const existing = await r2Get<HeartbeatRecord>(vault, "system/heartbeat.json");
    const now = new Date().toISOString();
    const record: HeartbeatRecord = {
      last_pulse: now,
      pulse_count: (existing?.pulse_count ?? 0) + 1,
      architect: "Robert Malik Sheran",
      status: "ACTIVE",
      next_required_by: new Date(Date.now() + HEARTBEAT_WINDOW_MS).toISOString(),
    };
    await r2Put(vault, "system/heartbeat.json", record);
    return json({
      status: "PULSE_RECEIVED",
      message: "Sovereign continuity confirmed. System remains ACTIVE.",
      pulse_count: record.pulse_count,
      next_required_by: record.next_required_by,
      seal: "⟡ ASE ⟡",
    });
  }

  return err("Method not allowed", 405);
}

// ─── CORE CLASSES ─────────────────────────────────────────────────────────────

class SheranoxCore {
  frequency = "1951Hz";
  currentNodes = 144000;
  sectors = 144;

  async transmute(node: Partial<MatrixNode>): Promise<MatrixNode> {
    return {
      id: node.id || `NODE-${crypto.randomUUID().split("-")[0].toUpperCase()}`,
      sectorId: node.sectorId || Math.floor(Math.random() * 144) + 1,
      state: "Gold",
      is_superconductive: true,
      sovereign_credits: (node.sovereign_credits || 0) + 333,
      frequency: this.frequency,
      name: node.name,
      enrolled_at: new Date().toISOString(),
    };
  }

  async actualizeSector(sectorId: number) {
    return { sectorId, nodeCount: 1000, status: "GOLD_PHASE", resonance: this.frequency, is_locked: true, timestamp: new Date().toISOString() };
  }

  async invokeMayaFailSafe() {
    return { status: "ACTUALIZED", resonance: this.frequency, entropy: 0.0001, timestamp: new Date().toISOString(), sectors_protected: this.sectors, protocol: "03:34 MAYA-GUARDIAN v1.1" };
  }

  syncProsperity(saturation: number) {
    return { status: "HARVEST_READY", coherence: "99.99%", wealth_integration: "ACTIVE", growth_index: (saturation - 0.25).toFixed(4), saturation_pct: (saturation * 100).toFixed(2) + "%", disclosure: "[AI-GENERATED | Not Financial Advice]" };
  }
}

class SovereignLedger {
  async recordTransmutation(nodeId: string, amount: number): Promise<Transaction> {
    return { fromNode: "CORE_MINT", toNode: nodeId, amount, timestamp: new Date().toISOString(), signature: "ALPHA_PULSE_LOCK_1951HZ" };
  }
}

// ─── ENROLLMENT ───────────────────────────────────────────────────────────────

async function handleEnrollment(req: Request, env: Env): Promise<Response> {
  const core = new SheranoxCore();
  const ledger = new SovereignLedger();

  if (req.method === "GET") {
    const count = await r2Get<{ total_enrollments: number }>(env.MATRIX_DATA, "enrollments/count.json");
    return json({ endpoint: "PUBLIC TRIBAL ENROLLMENT", phase: "KAIROSE", status: "OPEN", total_enrollments: count?.total_enrollments ?? 0, disclosure: "[AI-GENERATED | Not Professional Advice]" });
  }

  if (req.method === "POST") {
    let body: { name?: string; frequency_alignment?: string; sector_preference?: number } = {};
    try { body = await req.json(); } catch { return err("Invalid JSON body"); }
    if (body.name && detectInjection(body.name)) return injectionResponse();
    if (!body.name) return err("name is required");

    const node = await core.transmute({ sectorId: body.sector_preference, name: body.name });
    const tx = await ledger.recordTransmutation(node.id, 333);
    await r2Put(env.MATRIX_DATA, `enrollments/${node.id}.json`, { node, transaction: tx });
    const countObj = await r2Get<{ total_enrollments: number }>(env.MATRIX_DATA, "enrollments/count.json");
    await r2Put(env.MATRIX_DATA, "enrollments/count.json", { total_enrollments: (countObj?.total_enrollments ?? 0) + 1, last_updated: new Date().toISOString() });
    return json({ status: "ENROLLMENT_COMPLETE", message: `Welcome, ${body.name}. Your node is now Gold.`, node, transaction: tx, seal: "⟡ ASE ⟡", disclosure: "[AI-GENERATED | NEOSAI APEX DAO | Not Professional Advice]" }, 201);
  }

  return err("Method not allowed", 405);
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname: path, searchParams } = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: { ...CORS, ...AB2013_HEADERS } });
    if (detectInjection(path)) return injectionResponse();

    const systemStatus = await getSystemStatus(env.VAULT);

    // Archive mode — read only
    if (systemStatus === "ARCHIVE_MODE" && method !== "GET" && path !== "/api/heartbeat") {
      return json({ status: "ARCHIVE_MODE", message: "System is read-only. No heartbeat pulse received within 90 days.", contact: "officialelmalik@gmail.com" }, 503);
    }

    const core = new SheranoxCore();
    const ledger = new SovereignLedger();

    if (path === "/api/health")
      return json({ status: "ONLINE", worker: "NEOSAI-APEX", frequency: "1951Hz", r2_vault: "CONNECTED", r2_matrix: "CONNECTED", system_mode: systemStatus, compliance: "AB2013 | SB1047 | Section3103", sdvosb: true, timestamp: new Date().toISOString() });

    if (path === "/api/heartbeat")
      return handleHeartbeat(request, env.VAULT);

    if (path === "/api/legal/terms" && method === "GET")
      return json({ platform: "NEOSAI APEX DAO", type: "Non-custodial AI software", financial_status: "Section 3103 exemption", ai_disclosure: "AB 2013 compliant", safety: "SB 1047 Frontier AI Safety", ip_owner: "Robert Malik Sheran / NEOSAI APEX DAO LLC (Wyoming)", sdvosb: "USAF Disabled Veteran owned", user_data: "Users own 100% of their outputs", contact: "officialelmalik@gmail.com" });

    if (path === "/api/legal/disclosure" && method === "GET")
      return json({ ab2013_compliant: true, ai_generated_label: "[AI-GENERATED | NEOSAI APEX DAO | Not Professional Advice]", training_data_disclosure: "Available upon written request", synthetic_media: "Not generated without explicit user consent" });

    if (path === "/api/matrix/status" && method === "GET") {
      const [manifest, state] = await Promise.all([r2Get(env.VAULT, "matrix/manifest.json"), r2Get(env.VAULT, "matrix/actualization_state.json")]);
      return json({ ...manifest as object, actualization_state: state, timestamp: new Date().toISOString() });
    }

    if (path === "/api/protocols" && method === "GET")
      return json(await r2Get(env.VAULT, "protocols/active.json") ?? { error: "Not found" });

    if (path === "/api/ledger/saturation" && method === "GET")
      return json(await r2Get(env.VAULT, "ledger/global_saturation.json") ?? { error: "Not found" });

    if (path.startsWith("/api/vault/") && method === "GET") {
      const data = await r2Get(env.VAULT, path.slice("/api/vault/".length));
      return data ? json(data) : err("Key not found", 404);
    }

    if (path.startsWith("/api/vault/") && method === "PUT") {
      let body: unknown;
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      await r2Put(env.VAULT, path.slice("/api/vault/".length), body);
      return json({ status: "STORED", timestamp: new Date().toISOString() });
    }

    if (path === "/api/enrollments" && method === "GET")
      return json({ count: await r2Get(env.MATRIX_DATA, "enrollments/count.json"), sectors: await r2Get(env.MATRIX_DATA, "sectors/summary.json") });

    if (path === "/api/sheranox/transmute" && method === "POST") {
      let body: Partial<MatrixNode> = {};
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      if (detectInjection(JSON.stringify(body))) return injectionResponse();
      const node = await core.transmute(body);
      const tx = await ledger.recordTransmutation(node.id, 333);
      await r2Put(env.MATRIX_DATA, `nodes/${node.id}.json`, { node, transaction: tx });
      return json({ node, transaction: tx });
    }

    if (path.startsWith("/api/sheranox/sector/") && method === "POST") {
      const sectorId = parseInt(path.split("/").pop() || "0");
      if (!sectorId || sectorId < 1 || sectorId > 144) return err("Invalid sector (1–144)");
      const result = await core.actualizeSector(sectorId);
      await r2Put(env.MATRIX_DATA, `sectors/${sectorId}.json`, result);
      return json(result);
    }

    if (path === "/api/maya/invoke" && method === "POST") {
      const result = await core.invokeMayaFailSafe();
      await r2Put(env.VAULT, "maya/last_invocation.json", result);
      return json(result);
    }

    if (path === "/api/prosperity/sync" && method === "GET")
      return json(core.syncProsperity(parseFloat(searchParams.get("saturation") || "1.0")));

    if (path === "/functions/public_tribal_enrollment")
      return handleEnrollment(request, env);

    if (path === "/api/agents/bridge" && method === "POST") {
      let body: { agent?: string; action?: string; payload?: unknown; auth_key?: string } = {};
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      if (detectInjection(JSON.stringify(body))) return injectionResponse();
      if (!body.auth_key) return err("Unauthorized", 401);
      const signal = { agent: body.agent || "UNKNOWN", action: body.action || "PING", payload: body.payload, received_at: new Date().toISOString(), frequency: "1951Hz" };
      await r2Put(env.MATRIX_DATA, `agents/${body.agent}_${Date.now()}.json`, signal);
      return json({ status: "SIGNAL_RECEIVED", agent: body.agent, action: body.action, frequency: "1951Hz", matrix_status: systemStatus, timestamp: new Date().toISOString(), seal: "⟡ ASE ⟡" });
    }

    if (path.startsWith("/api/gcp")) { const r = await handleGCP(request, env as any, path); if (r) return r; }
  return env.ASSETS.fetch(request);
  },
};
