import { Router } from "express";
import { prisma } from "../prisma";

const r = Router();

// List
r.get("/", async (_req, res) => {
  const cams = await prisma.camera.findMany({ orderBy: { id: "asc" } });
  res.json(cams);
});

// Create
r.post("/", async (req, res) => {
  const { id, name, rtspUrl } = req.body;

  if (!id || !name || !rtspUrl) {
    return res.status(400).json({ error: "id, name, rtspUrl are required" });
  }

  const cam = await prisma.camera.create({
    data: {
      id: String(id),
      name: String(name),
      rtspUrl: String(rtspUrl),
      isActive: false,
    },
  });

  res.json(cam);
});

// Update
r.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, rtspUrl, isActive } = req.body;

  const cam = await prisma.camera.update({
    where: { id: String(id) },
    data: {
      name: name !== undefined ? String(name) : undefined,
      rtspUrl: rtspUrl !== undefined ? String(rtspUrl) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    },
  });

  res.json(cam);
});

// Delete (prevent deleting default laptop cam)
r.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (id === "cam1") {
    return res
      .status(400)
      .json({ error: "Default laptop camera cannot be deleted" });
  }

  await prisma.camera.delete({ where: { id: String(id) } });
  res.json({ ok: true });
});

export default r;
