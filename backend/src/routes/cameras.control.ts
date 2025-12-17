import { Router } from "express";
import axios from "axios";
import { prisma } from "../prisma";

const r = Router();

const AI_BASE = process.env.AI_BASE_URL || "http://127.0.0.1:8000";

/**
 * START CAMERA
 * POST /api/cameras/:id/start
 */
r.post("/:id/start", async (req, res) => {
  const { id } = req.params;

  const cam = await prisma.camera.findUnique({ where: { id } });
  if (!cam) {
    return res.status(404).json({ error: "Camera not found" });
  }

  // Call AI server
  await axios.post(`${AI_BASE}/camera/start`, null, {
    params: {
      camera_id: cam.id,
      rtsp_url: cam.rtspUrl,
    },
  });

  // Update DB
  await prisma.camera.update({
    where: { id },
    data: { isActive: true },
  });

  res.json({ ok: true });
});

/**
 * STOP CAMERA
 * POST /api/cameras/:id/stop
 */
r.post("/:id/stop", async (req, res) => {
  const { id } = req.params;

  const cam = await prisma.camera.findUnique({ where: { id } });
  if (!cam) {
    return res.status(404).json({ error: "Camera not found" });
  }

  await axios.post(`${AI_BASE}/camera/stop`, null, {
    params: { camera_id: cam.id },
  });

  await prisma.camera.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ ok: true });
});

export default r;
