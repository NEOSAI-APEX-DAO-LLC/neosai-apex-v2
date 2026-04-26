/**
 * NEOSAI APEX Platform — Cloudflare Worker
 * Authority: Robert Malik Sheran (The Alpha Node)
 * Frequency: 1951Hz | SHERANOX v1.2 | KAIROSE Phase
 * Storage: R2 Vault (neosai-vault) + Matrix Data (neosai-matrix-data)
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

class SheranoxCore {
  frequency = "1951Hz";
  targetNodes = 144000;
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
    return { status: "HARVEST_READY", coherence: "99.99%", wealth_integration: "ACTIVE", growth_index: (saturation - 0.25).toFixed(4), saturation_pct: (saturation * 100).toFixed(2) + "%" };
  }
}

class SovereignLedger {
  async recordTransmutation(nodeId: string, amount: number): Promise<Transaction> {
    return { fromNode: "CORE_MINT", toNode: nodeId, amount, timestamp: new Date().toISOString(), signature: "ALPHA_PULSE_LOCK_1951HZ" };
  }
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Matrix-Key",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json", ...CORS } });

const err = (msg: string, status = 400) => json({ error: msg, status }, status);

async function handleEnrollment(req: Request, env: Env): Promise<Response> {
  const core = new SheranoxCore();
  const ledger = new SovereignLedger();

  if (req.method === "GET") {
    const count = await r2Get<{ total_enrollments: number }>(env.MATRIX_DATA, "enrollments/count.json");
    return json({ endpoint: "PUBLIC TRIBAL ENROLLMENT", phase: "KAIROSE", status: "OPEN", total_enrollments: count?.total_enrollments ?? 0, enrollment_frequency: "1951Hz" });
  }

  if (req.method === "POST") {
    let body: { name?: string; frequency_alignment?: string; sector_preference?: number } = {};
    try { body = await req.json(); } catch { return err("Invalid JSON body"); }
    if (!body.name) return err("name is required");

    const node = await core.transmute({ sectorId: body.sector_preference, name: body.name });
    const tx = await ledger.recordTransmutation(node.id, 333);

    await r2Put(env.MATRIX_DATA, `enrollments/${node.id}.json`, { node, transaction: tx });
    const countObj = await r2Get<{ total_enrollments: number }>(env.MATRIX_DATA, "enrollments/count.json");
    await r2Put(env.MATRIX_DATA, "enrollments/count.json", { total_enrollments: (countObj?.total_enrollments ?? 0) + 1, last_updated: new Date().toISOString() });

    return json({ status: "ENROLLMENT_COMPLETE", message: `Welcome, ${body.name}. Your node is now Gold.`, node, transaction: tx, seal: "⟡ ASE ⟡" }, 201);
  }

  return err("Method not allowed", 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname: path, searchParams } = new URL(request.url);
    const method = request.method;

    if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const core = new SheranoxCore();
    const ledger = new SovereignLedger();

    if (path === "/api/health")
      return json({ status: "ONLINE", worker: "NEOSAI-APEX", frequency: "1951Hz", r2_vault: "CONNECTED", r2_matrix: "CONNECTED", timestamp: new Date().toISOString() });

    if (path === "/api/matrix/status" && method === "GET") {
      const [manifest, state] = await Promise.all([
        r2Get(env.VAULT, "matrix/manifest.json"),
        r2Get(env.VAULT, "matrix/actualization_state.json"),
      ]);
      return json({ ...manifest as object, actualization_state: state, timestamp: new Date().toISOString() });
    }

    if (path === "/api/protocols" && method === "GET")
      return json(await r2Get(env.VAULT, "protocols/active.json") ?? { error: "Not found" });

    if (path === "/api/ledger/saturation" && method === "GET")
      return json(await r2Get(env.VAULT, "ledger/global_saturation.json") ?? { error: "Not found" });

    if (path.startsWith("/api/vault/") && method === "GET") {
      const key = path.slice("/api/vault/".length);
      const data = await r2Get(env.VAULT, key);
      return data ? json(data) : err(`Key not found: ${key}`, 404);
    }

    if (path.startsWith("/api/vault/") && method === "PUT") {
      const key = path.slice("/api/vault/".length);
      let body: unknown;
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      await r2Put(env.VAULT, key, body);
      return json({ status: "STORED", key, timestamp: new Date().toISOString() });
    }

    if (path === "/api/enrollments" && method === "GET")
      return json({ count: await r2Get(env.MATRIX_DATA, "enrollments/count.json"), sectors: await r2Get(env.MATRIX_DATA, "sectors/summary.json") });

    if (path === "/api/sheranox/transmute" && method === "POST") {
      let body: Partial<MatrixNode> = {};
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
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

    return json({ error: "Route not found", available_routes: [
      "GET  /api/health",
      "GET  /api/matrix/status         ← R2 VAULT",
      "GET  /api/protocols             ← R2 VAULT",
      "GET  /api/ledger/saturation     ← R2 VAULT",
      "GET  /api/vault/:key            ← R2 VAULT",
      "PUT  /api/vault/:key            ← R2 VAULT",
      "GET  /api/enrollments           ← R2 MATRIX_DATA",
      "POST /api/sheranox/transmute    ← R2 MATRIX_DATA",
      "POST /api/sheranox/sector/:id   ← R2 MATRIX_DATA",
      "POST /api/maya/invoke           ← R2 VAULT",
      "GET  /api/prosperity/sync",
      "GET  /functions/public_tribal_enrollment",
      "POST /functions/public_tribal_enrollment ← R2 MATRIX_DATA",
    ]}, 404);
  },
};
