import { Router } from "express";
import axios from "axios";
import { prisma } from "../prisma";

const r = Router();
const AI = (process.env.AI_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

r.post("/start", async (req, res) => {
  const { name, employeeId, cameraId } = req.body;

  if (!name || !cameraId) {
    return res.status(400).json({ error: "name and cameraId are required" });
  }

  const cam = await prisma.camera.findUnique({
    where: { id: String(cameraId) },
  });
  if (!cam) return res.status(404).json({ error: "Camera not found" });

  const ai = await axios.post(`${AI}/enroll/session/start`, {
    name,
    employeeId: employeeId ?? null,
    cameraId: String(cameraId), // AI expects cameraId, not rtspUrl
  });

  res.json(ai.data);
});

r.post("/stop", async (_req, res) => {
  const ai = await axios.post(`${AI}/enroll/session/stop`);
  res.json(ai.data);
});

r.get("/status", async (_req, res) => {
  const ai = await axios.get(`${AI}/enroll/session/status`);
  res.json(ai.data);
});

export default r;
