import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function getStats(_req: Request, res: Response) {
  try {
    const [employees, attendance] = await Promise.all([
      prisma.employee.count(),
      prisma.attendance.count(),
    ]);
    res.json({ employees, attendance });
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to load stats",
      detail: e?.message ?? String(e),
    });
  }
}
