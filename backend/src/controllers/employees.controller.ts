import { Request, Response } from "express";
import { prisma } from "../prisma";

export async function getEmployees(_req: Request, res: Response) {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(employees);
  } catch (e: any) {
    res.status(500).json({
      error: "Failed to load employees",
      detail: e?.message ?? String(e),
    });
  }
}

export async function upsertEmployee(req: Request, res: Response) {
  try {
    const { id, name } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const employee = await prisma.employee.upsert({
      where: { id: id ?? "__new__" },
      update: { name },
      create: { id, name },
    });

    res.json(employee);
  } catch {
    try {
      const { name } = req.body;
      const created = await prisma.employee.create({ data: { name } });
      res.json(created);
    } catch (e2: any) {
      res.status(500).json({
        error: "Failed to upsert employee",
        detail: e2?.message ?? String(e2),
      });
    }
  }
}
