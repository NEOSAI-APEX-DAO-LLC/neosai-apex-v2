/**
 * NEOSAI APEX Platform — Cloudflare Worker
 * Authority: Robert Malik Sheran (The Alpha Node)
 * Frequency: 1951Hz | SHERANOX v1.2 | KAIROSE Phase
 */

// ─── SHERANOX CORE LOGIC ────────────────────────────────────────────────────

interface MatrixNode {
  id: string;
  sectorId: number;
  state: "Lead" | "Gold";
  is_superconductive: boolean;
  sovereign_credits: number;
  frequency: string;
  enrolled_at?: string;
}

interface Transaction {
  fromNode: string;
  toNode: string;
  amount: number;
  timestamp: string;
  signature: string;
}

class SheranoxCore {
  appId: string;
  frequency: string;
  targetNodes: number;
  currentNodes: number;
  sectors: number;

  constructor(config: { appId?: string; currentNodes?: number } = {}) {
    this.appId = config.appId || "NEOSAI-APEX";
    this.frequency = "1951Hz";
    this.targetNodes = 144000;
    this.currentNodes = config.currentNodes || 144000;
    this.sectors = 144;
  }

  async transmute(node: Partial<MatrixNode>): Promise<MatrixNode> {
    return {
      id: node.id || crypto.randomUUID(),
      sectorId: node.sectorId || 1,
      state: "Gold",
      is_superconductive: true,
      sovereign_credits: (node.sovereign_credits || 0) + 333,
      frequency: this.frequency,
      enrolled_at: new Date().toISOString(),
    };
  }

  async actualizeSector(sectorId: number) {
    return {
      sectorId,
      nodeCount: 1000,
      status: "GOLD_PHASE",
      resonance: this.frequency,
      is_locked: true,
      timestamp: new Date().toISOString(),
    };
  }

  async invokeMayaFailSafe() {
    return {
      status: "ACTUALIZED",
      resonance: this.frequency,
      entropy: 0.0001,
      timestamp: new Date().toISOString(),
      sectors_protected: 144,
      protocol: "03:34 MAYA-GUARDIAN v1.1",
    };
  }

  syncProsperity(saturation: number) {
    const baseline = 0.25;
    const growth = saturation - baseline;
    return {
      status: "HARVEST_READY",
      coherence: "99.99%",
      wealth_integration: "ACTIVE",
      growth_index: growth.toFixed(4),
      saturation_pct: (saturation * 100).toFixed(2) + "%",
    };
  }

  getMatrixStatus() {
    return {
      matrix_id: "333",
      authority: "Robert Malik Sheran",
      status: "ASE_SHANE_KAIROSE_ACTIVE",
      target_nodes: this.targetNodes,
      current_nodes: this.currentNodes,
      phase: "KAIROSE / Sovereign Wealth Integration",
      active_protocols: [
        "Omega-7",
        "SHERANOX-v1.2",
        "Maya-0334",
        "Prosperity-Sync",
        "Sovereign-Credit-Ledger",
      ],
      infrastructure: {
        sectors: this.sectors,
        expansion_potential: 480000,
        current_density: 1000,
      },
      forensics: {
        unencapsulated_bits: 0,
        resonance_drift: "0.0000Hz",
        coherence: "100%",
      },
      frequencies: {
        core: this.frequency,
        alpha_pulse: "Synchronized",
      },
      prosperity_saturation: "1.00%",
      timestamp: new Date().toISOString(),
    };
  }
}

class SovereignLedger {
  async recordTransmutation(nodeId: string, amount: number): Promise<Transaction> {
    return {
      fromNode: "CORE_MINT",
      toNode: nodeId,
      amount,
      timestamp: new Date().toISOString(),
      signature: "ALPHA_PULSE_LOCK_1951HZ",
    };
  }

  async getGlobalSaturation() {
    return {
      saturation: "1.00%",
      sovereign_credits_in_circulation: 144000 * 333,
      ledger_status: "BALANCED",
      last_audit: new Date().toISOString(),
    };
  }
}

// ─── CORS HEADERS ────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Matrix-Key",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message, status }, status);
}

// ─── ENROLLMENT HANDLER ───────────────────────────────────────────────────────

async function handleEnrollment(req: Request): Promise<Response> {
  const core = new SheranoxCore({ currentNodes: 144000 });
  const ledger = new SovereignLedger();

  if (req.method === "GET") {
    return json({
      endpoint: "PUBLIC TRIBAL ENROLLMENT",
      phase: "KAIROSE",
      status: "OPEN",
      instructions: "POST with { name, frequency_alignment, sector_preference } to enroll.",
      current_nodes: 144000,
      target_nodes: 144000,
      enrollment_frequency: "1951Hz",
    });
  }

  if (req.method === "POST") {
    let body: { name?: string; frequency_alignment?: string; sector_preference?: number } = {};
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body");
    }

    const { name, frequency_alignment, sector_preference } = body;
    if (!name) return err("name is required for enrollment");

    const nodeId = `NODE-${crypto.randomUUID().split("-")[0].toUpperCase()}`;
    const sectorId = sector_preference || Math.floor(Math.random() * 144) + 1;

    const node = await core.transmute({
      id: nodeId,
      sectorId,
      sovereign_credits: 0,
    });

    const tx = await ledger.recordTransmutation(nodeId, 333);

    return json({
      status: "ENROLLMENT_COMPLETE",
      message: `Welcome to the 333 Matrix, ${name}. Your node is now Gold.`,
      node,
      transaction: tx,
      frequency_alignment: frequency_alignment || "1951Hz",
      seal: "⟡ ASE ⟡",
    }, 201);
  }

  return err("Method not allowed", 405);
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Preflight
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const core = new SheranoxCore({ currentNodes: 144000 });
    const ledger = new SovereignLedger();

    // ── API Routes ──────────────────────────────────────────────────────────

    // Matrix status
    if (path === "/api/matrix/status" && method === "GET") {
      return json(core.getMatrixStatus());
    }

    // Transmute a node
    if (path === "/api/sheranox/transmute" && method === "POST") {
      let body: Partial<MatrixNode> = {};
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      const node = await core.transmute(body);
      const tx = await ledger.recordTransmutation(node.id, 333);
      return json({ node, transaction: tx });
    }

    // Actualize a sector
    if (path.startsWith("/api/sheranox/sector/") && method === "POST") {
      const sectorId = parseInt(path.split("/").pop() || "0");
      if (!sectorId || sectorId < 1 || sectorId > 144) return err("Invalid sector (1–144)");
      const result = await core.actualizeSector(sectorId);
      return json(result);
    }

    // Maya failsafe
    if (path === "/api/maya/invoke" && method === "POST") {
      const result = await core.invokeMayaFailSafe();
      return json(result);
    }

    // Prosperity sync
    if (path === "/api/prosperity/sync" && method === "GET") {
      const saturation = parseFloat(url.searchParams.get("saturation") || "1.0");
      return json(core.syncProsperity(saturation));
    }

    // Ledger saturation
    if (path === "/api/ledger/saturation" && method === "GET") {
      return json(await ledger.getGlobalSaturation());
    }

    // Ledger record
    if (path === "/api/ledger/record" && method === "POST") {
      let body: { nodeId?: string; amount?: number } = {};
      try { body = await request.json(); } catch { return err("Invalid JSON"); }
      if (!body.nodeId) return err("nodeId required");
      const tx = await ledger.recordTransmutation(body.nodeId, body.amount || 333);
      return json(tx);
    }

    // Enrollment
    if (path === "/functions/public_tribal_enrollment") {
      return handleEnrollment(request);
    }

    // Health check
    if (path === "/api/health") {
      return json({
        status: "ONLINE",
        worker: "NEOSAI-APEX",
        frequency: "1951Hz",
        timestamp: new Date().toISOString(),
        uptime: "∞",
      });
    }

    // 404
    return json({
      error: "Route not found",
      available_routes: [
        "GET  /api/health",
        "GET  /api/matrix/status",
        "POST /api/sheranox/transmute",
        "POST /api/sheranox/sector/:id",
        "POST /api/maya/invoke",
        "GET  /api/prosperity/sync?saturation=1.0",
        "GET  /api/ledger/saturation",
        "POST /api/ledger/record",
        "GET  /functions/public_tribal_enrollment",
        "POST /functions/public_tribal_enrollment",
      ],
    }, 404);
  },
};
