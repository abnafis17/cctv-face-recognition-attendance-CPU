import { Router } from "express";
import axios from "axios";
import { prisma } from "../prisma";

const router = Router();
const AI_BASE_URL = process.env.AI_BASE_URL || "http://127.0.0.1:8000";

// list cameras
router.get("/", async (_req, res) => {
  const cams = await prisma.camera.findMany({ orderBy: { name: "asc" } });
  res.json(cams);
});

// add camera
router.post("/", async (req, res) => {
  const { id, name, rtspUrl } = req.body;

  const cam = await prisma.camera.create({
    data: { id, name, rtspUrl, isActive: false },
  });

  res.json(cam);
});

// start camera
router.post("/:id/start", async (req, res) => {
  const cam = await prisma.camera.findUnique({ where: { id: req.params.id } });
  if (!cam) return res.status(404).json({ error: "Camera not found" });

  await axios.post(`${AI_BASE_URL}/camera/start`, null, {
    params: {
      camera_id: cam.id,
      rtsp_url: cam.rtspUrl,
    },
  });

  await prisma.camera.update({
    where: { id: cam.id },
    data: { isActive: true },
  });

  res.json({ ok: true });
});

// stop camera
router.post("/:id/stop", async (req, res) => {
  await axios.post(`${AI_BASE_URL}/camera/stop`, null, {
    params: { camera_id: req.params.id },
  });

  await prisma.camera.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ ok: true });
});

export default router;
