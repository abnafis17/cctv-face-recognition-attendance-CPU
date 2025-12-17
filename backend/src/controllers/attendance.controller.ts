import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function createAttendance(req: Request, res: Response) {
  try {
    const { employeeId, timestamp, cameraId, confidence, snapshotPath } =
      req.body;
    if (!employeeId || !timestamp)
      return res
        .status(400)
        .json({ error: "employeeId and timestamp required" });

    await prisma.employee.upsert({
      where: { id: employeeId },
      update: {},
      create: { id: employeeId, name: "Unknown" },
    });

    const row = await prisma.attendance.create({
      data: {
        employeeId,
        timestamp: new Date(timestamp),
        cameraId: cameraId ?? null,
        confidence: confidence ?? null,
      },
    });

    res.json({ ok: true, attendance: row, snapshotPath: snapshotPath ?? null });
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to create attendance",
      detail: e?.message ?? String(e),
    });
  }
}

export async function listAttendance(req: Request, res: Response) {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);

    const rows = await prisma.attendance.findMany({
      include: { employee: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.json(
      rows.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        name: r.employee.name,
        timestamp: r.timestamp.toISOString(),
        cameraId: r.cameraId,
        confidence: r.confidence,
      }))
    );
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to load attendance",
      detail: e?.message ?? String(e),
    });
  }
}
