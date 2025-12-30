import { Router } from "express";
import axios from "axios";
import { prisma } from "../prisma";

const r = Router();

const AI_BASE = process.env.AI_BASE_URL || "http://127.0.0.1:8000";

/**
 * START CAMERA
 * POST /api/v1/cameras/start/:id
 */
r.post("/start/:id", async (req, res) => {
  try {
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

    return res.json({ ok: true });
  } catch (error) {
    console.error("START CAMERA FAILED:", error);
    return res.status(500).json({ error: "Failed to start camera" });
  }
});

/**
 * STOP CAMERA
 * POST /api/v1/cameras/stop/:id
 */
r.post("/stop/:id", async (req, res) => {
  try {
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

    return res.json({ ok: true });
  } catch (error) {
    console.error("STOP CAMERA FAILED:", error);
    return res.status(500).json({ error: "Failed to stop camera" });
  }
});

export default r;
