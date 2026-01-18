import { Router } from "express";
import { prisma } from "../prisma";
import { makePairCode, randomToken, sha256Hex } from "../utils/relayCrypto";
import { signAgentToken } from "../utils/jwt";
import { requireAgent } from "../middleware/agent";
import { requireCompany } from "../middleware/company";

const r = Router();

// (User/Admin) Create pair code (must be authenticated user)
// POST /agents/pair-codes
r.post("/pair-codes", requireCompany, async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const agentName = String(req.body?.agentName ?? "").trim();

  if (!companyId)
    return res.status(400).json({ error: "companyId is required" });
  if (!agentName)
    return res.status(400).json({ error: "agentName is required" });

  const code = makePairCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.pairCode.create({
    data: { code, companyId, agentName, expiresAt },
  });

  res.json({ code, expiresAt });
});

// (Agent) Register using pair code (public)
// POST /agents/register
r.post("/register", async (req, res) => {
  const code = String(req.body?.code ?? "").trim();
  const publicKeyPem = String(req.body?.publicKeyPem ?? "").trim();

  if (!code || !publicKeyPem) {
    return res
      .status(400)
      .json({ error: "code and publicKeyPem are required" });
  }

  const pair = await prisma.pairCode.findUnique({ where: { code } });
  if (!pair) return res.status(400).json({ error: "Invalid code" });
  if (pair.expiresAt.getTime() < Date.now())
    return res.status(400).json({ error: "Code expired" });

  const companyId = String(pair.companyId ?? "");
  if (!companyId)
    return res.status(400).json({ error: "PairCode has no companyId" });

  const refreshToken = randomToken(32);
  const refreshTokenHash = sha256Hex(refreshToken);

  const agent = await prisma.relayAgent.create({
    data: {
      name: pair.agentName,
      companyId,
      publicKeyPem,
      refreshTokenHash,
      isActive: true,
    },
  });

  await prisma.pairCode.delete({ where: { code } });

  res.json({ agentId: agent.id, refreshToken });
});

// (Agent) Get access token (public)
// POST /agents/token
r.post("/token", async (req, res) => {
  const agentId = String(req.body?.agentId ?? "").trim();
  const refreshToken = String(req.body?.refreshToken ?? "").trim();

  if (!agentId || !refreshToken) {
    return res
      .status(400)
      .json({ error: "agentId and refreshToken are required" });
  }

  const agent = await prisma.relayAgent.findUnique({ where: { id: agentId } });
  if (!agent) return res.status(404).json({ error: "Agent not found" });

  if (sha256Hex(refreshToken) !== agent.refreshTokenHash) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  const companyId = String(agent.companyId ?? "");
  if (!companyId)
    return res.status(400).json({ error: "Agent has no companyId" });

  const accessToken = signAgentToken({ sub: agent.id, companyId });
  res.json({ accessToken });
});

// (Agent) Get assigned cameras (agent token required)
// GET /agents/:id/cameras
r.get("/:id/cameras", requireAgent, async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const agentIdFromToken = String((req as any).agentId ?? "");
  const agentIdParam = String(req.params.id ?? "");

  if (agentIdParam !== agentIdFromToken) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const cams = await prisma.camera.findMany({
    where: { companyId, relayAgentId: agentIdParam },
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      rtspUrlEnc: true,
      sendFps: true,
      sendWidth: true,
      sendHeight: true,
      jpegQuality: true,
      isActive: true,
      updatedAt: true,
    },
  });

  res.json(cams);
});

// (Agent) Heartbeat (agent token required)
// POST /agents/:id/heartbeat
r.post("/:id/heartbeat", requireAgent, async (req, res) => {
  const agentIdFromToken = String((req as any).agentId ?? "");
  const agentIdParam = String(req.params.id ?? "");

  if (agentIdParam !== agentIdFromToken) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await prisma.relayAgent.update({
    where: { id: agentIdParam },
    data: { lastSeenAt: new Date() },
  });

  res.json({ ok: true });
});

// (User/Admin) List relay agents for this company (UI dropdown + status page)
// GET /agents
r.get("/", requireCompany, async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  if (!companyId)
    return res.status(400).json({ error: "companyId is required" });

  const agents = await prisma.relayAgent.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      lastSeenAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json(agents);
});

export default r;
