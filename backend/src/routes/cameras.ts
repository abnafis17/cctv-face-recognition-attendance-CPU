import { Router } from "express";
import { prisma } from "../prisma";
import {
  cameraPublicId,
  findCameraByAnyId,
  normalizeCameraIdentifier,
} from "../utils/camera";
import { encryptForAgent } from "../utils/relayCrypto";

const r = Router();

function isTruthy(v: any) {
  return v !== undefined && v !== null;
}

function relayPlaceholder(cameraId: string) {
  return `relay://${cameraId}`;
}

// List
r.get("/", async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const cams = await prisma.camera.findMany({
    where: { companyId },
    orderBy: { id: "asc" },
  });
  // Normalize relay placeholder for consistency (even for legacy rows)
  res.json(
    cams.map((c) =>
      c.relayAgentId ? { ...c, rtspUrl: relayPlaceholder(c.id) } : c,
    ),
  );
});

// Create
r.post("/", async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const name = String(req.body?.name ?? "").trim();
  const rtspUrlInput = String(req.body?.rtspUrl ?? "").trim();

  const relayAgentId = isTruthy(req.body?.relayAgentId)
    ? String(req.body.relayAgentId).trim()
    : isTruthy(req.body?.relay_agent_id)
      ? String(req.body.relay_agent_id).trim()
      : null;

  const camId =
    normalizeCameraIdentifier(
      req.body?.camId ?? req.body?.cameraId ?? req.body?.cam_id ?? req.body?.id,
    ) ?? null;

  if (!name || !rtspUrlInput) {
    return res.status(400).json({ error: "name and rtspUrl are required" });
  }

  // optional relay settings
  const sendFps = isTruthy(req.body?.sendFps)
    ? Number(req.body.sendFps)
    : undefined;
  const sendWidth = isTruthy(req.body?.sendWidth)
    ? Number(req.body.sendWidth)
    : undefined;
  const sendHeight = isTruthy(req.body?.sendHeight)
    ? Number(req.body.sendHeight)
    : undefined;
  const jpegQuality = isTruthy(req.body?.jpegQuality)
    ? Number(req.body.jpegQuality)
    : undefined;

  // Relay mode
  if (relayAgentId) {
    const agent = await prisma.relayAgent.findFirst({
      where: { id: relayAgentId, companyId },
    });
    if (!agent) return res.status(400).json({ error: "Invalid relayAgentId" });

    const rtspUrlEnc = encryptForAgent(agent.publicKeyPem, {
      rtspUrl: rtspUrlInput,
    });

    const cam = await prisma.$transaction(async (tx) => {
      const created = await tx.camera.create({
        data: {
          ...(camId ? { camId } : {}),
          name,
          // Placeholder only; real URL stays encrypted in rtspUrlEnc.
          rtspUrl: "relay://pending",
          rtspUrlEnc,
          relayAgentId,
          isActive: false,
          companyId,
          ...(sendFps !== undefined ? { sendFps } : {}),
          ...(sendWidth !== undefined ? { sendWidth } : {}),
          ...(sendHeight !== undefined ? { sendHeight } : {}),
          ...(jpegQuality !== undefined ? { jpegQuality } : {}),
        },
      });

      return tx.camera.update({
        where: { id: created.id },
        data: { rtspUrl: relayPlaceholder(created.id) },
      });
    });

    return res.json(cam);
  }

  // Direct mode (existing)
  const cam = await prisma.camera.create({
    data: {
      ...(camId ? { camId } : {}),
      name,
      rtspUrl: rtspUrlInput,
      isActive: false,
      companyId,
    },
  });

  res.json(cam);
});

// Update
r.put("/:id", async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const { id: anyId } = req.params;
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const { name, rtspUrl, isActive } = body as any;

  const existing = await findCameraByAnyId(String(anyId), companyId);
  if (!existing) return res.status(404).json({ error: "Camera not found" });

  const camIdKey = "camId" in body || "cameraId" in body || "cam_id" in body;

  const camId = camIdKey
    ? normalizeCameraIdentifier(
        (body as any)?.camId ??
          (body as any)?.cameraId ??
          (body as any)?.cam_id,
      )
    : undefined;

  const relayAgentIdKey = "relayAgentId" in body || "relay_agent_id" in body;
  const newRelayAgentId = relayAgentIdKey
    ? ((body as any).relayAgentId ?? (body as any).relay_agent_id ?? null)
    : undefined;

  const sendFps = isTruthy((body as any).sendFps)
    ? Number((body as any).sendFps)
    : undefined;
  const sendWidth = isTruthy((body as any).sendWidth)
    ? Number((body as any).sendWidth)
    : undefined;
  const sendHeight = isTruthy((body as any).sendHeight)
    ? Number((body as any).sendHeight)
    : undefined;
  const jpegQuality = isTruthy((body as any).jpegQuality)
    ? Number((body as any).jpegQuality)
    : undefined;

  const data: any = {
    camId,
    name: name !== undefined ? String(name) : undefined,
    isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    ...(sendFps !== undefined ? { sendFps } : {}),
    ...(sendWidth !== undefined ? { sendWidth } : {}),
    ...(sendHeight !== undefined ? { sendHeight } : {}),
    ...(jpegQuality !== undefined ? { jpegQuality } : {}),
  };

  // If switching or setting relay agent
  if (newRelayAgentId !== undefined) {
    const rid = newRelayAgentId ? String(newRelayAgentId).trim() : null;

    if (rid) {
      const agent = await prisma.relayAgent.findFirst({
        where: { id: rid, companyId },
      });
      if (!agent)
        return res.status(400).json({ error: "Invalid relayAgentId" });

      const isRelayAlready = !!existing.relayAgentId;
      const isSameAgent = existing.relayAgentId === rid;
      const isSwitchingAgents = isRelayAlready && !isSameAgent;

      // Determine plaintext RTSP to encrypt (we do NOT store it for relay).
      const providedPlain = rtspUrl !== undefined ? String(rtspUrl).trim() : "";
      const existingPlain =
        existing.rtspUrl && !existing.rtspUrl.startsWith("relay://")
          ? String(existing.rtspUrl).trim()
          : "";

      const shouldEncrypt =
        isSwitchingAgents || !isRelayAlready || rtspUrl !== undefined;

      if (shouldEncrypt) {
        const plainToEncrypt = providedPlain || (!isSwitchingAgents ? existingPlain : "");

        if (isSwitchingAgents && !providedPlain) {
          return res.status(400).json({
            error:
              "rtspUrl is required when changing relayAgentId (cannot re-encrypt without plaintext)",
          });
        }

        if (!plainToEncrypt) {
          return res.status(400).json({
            error: "rtspUrl is required when enabling relay mode",
          });
        }

        data.rtspUrlEnc = encryptForAgent(agent.publicKeyPem, {
          rtspUrl: plainToEncrypt,
        });
      } else if (!existing.rtspUrlEnc) {
        return res.status(400).json({
          error: "Relay camera is missing rtspUrlEnc; please re-save rtspUrl",
        });
      }

      data.relayAgentId = rid;
      data.rtspUrl = relayPlaceholder(existing.id); // placeholder
    } else {
      // removing relay -> direct mode
      if (rtspUrl === undefined) {
        return res.status(400).json({
          error: "rtspUrl is required when disabling relay mode",
        });
      }
      data.relayAgentId = null;
      data.rtspUrlEnc = null;

      if (rtspUrl !== undefined) {
        data.rtspUrl = String(rtspUrl).trim();
      }
    }
  } else {
    // no relay change; allow direct rtsp update ONLY if currently direct
    if (!existing.relayAgentId && rtspUrl !== undefined) {
      data.rtspUrl = String(rtspUrl).trim();
    }
    // If currently relay and they send rtspUrl without changing relayAgentId, ignore storing plaintext.
    if (existing.relayAgentId && rtspUrl !== undefined) {
      // optional: allow re-encrypt if they want to rotate RTSP without changing agent
      const agent = await prisma.relayAgent.findFirst({
        where: { id: existing.relayAgentId, companyId },
      });
      if (agent) {
        data.rtspUrlEnc = encryptForAgent(agent.publicKeyPem, {
          rtspUrl: String(rtspUrl).trim(),
        });
        data.rtspUrl = relayPlaceholder(existing.id);
      }
    }
  }

  const cam = await prisma.camera.update({
    where: { id: existing.id },
    data,
  });

  res.json(cam);
});

// Delete (prevent deleting default laptop cam)
r.delete("/:id", async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const { id: anyId } = req.params;

  const cam = await findCameraByAnyId(String(anyId), companyId);
  if (!cam) return res.status(404).json({ error: "Camera not found" });

  if (cameraPublicId(cam) === "cam1") {
    return res
      .status(400)
      .json({ error: "Default laptop camera cannot be deleted" });
  }

  await prisma.camera.delete({ where: { id: cam.id } });
  res.json({ ok: true });
});

export default r;
