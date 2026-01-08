import { Request, Response } from "express";
import { prisma } from "../prisma";
import {
  employeePublicId,
  getOrCreateEmployeeByAnyId,
  normalizeEmployeeIdentifier,
} from "../utils/employee";
import { findCameraByAnyId } from "../utils/camera";

export async function createAttendance(req: Request, res: Response) {
  try {
    const companyId = String((req as any).companyId ?? "");
    const { employeeId, timestamp, cameraId, confidence, snapshotPath } =
      req.body;
    const identifier = normalizeEmployeeIdentifier(employeeId);
    if (!identifier || !timestamp)
      return res
        .status(400)
        .json({ error: "employeeId and timestamp required" });

    const employee = await getOrCreateEmployeeByAnyId(identifier, companyId, {
      nameIfCreate: "Unknown",
    });

    const cam = cameraId
      ? await findCameraByAnyId(String(cameraId), companyId)
      : null;
    if (cameraId && !cam) {
      return res.status(404).json({ error: "Camera not found" });
    }

    const row = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        timestamp: new Date(timestamp),
        cameraId: cam ? cam.id : null,
        confidence: confidence ?? null,
        companyId,
      },
    });

    res.json({
      ok: true,
      attendance: row,
      employeeId: employeePublicId(employee),
      snapshotPath: snapshotPath ?? null,
    });
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to create attendance",
      detail: e?.message ?? String(e),
    });
  }
}

export async function listAttendance(req: Request, res: Response) {
  try {
    const companyId = String((req as any).companyId ?? "");
    const limit = Math.min(Number(req.query.limit || 100), 500);

    const rows = await prisma.attendance.findMany({
      where: { companyId },
      include: { employee: true, camera: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    res.json(
      rows.map((r) => ({
        id: r.id,
        employeeId: employeePublicId(r.employee),
        name: r.employee.name,
        timestamp: r.timestamp.toISOString(),
        cameraId: r.cameraId,
        cameraName: r.camera ? r.camera.name : null,
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
