import { prisma } from "../prisma";

export function normalizeEmployeeIdentifier(value: unknown): string | null {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

export async function findEmployeeByAnyId(
  identifier: string,
  companyId: string
) {
  const key = String(identifier ?? "").trim();
  if (!key) return null;

  return prisma.employee.findFirst({
    where: {
      companyId,
      OR: [{ empId: key }, { id: key }],
    },
  });
}

export async function getOrCreateEmployeeByAnyId(
  identifier: string,
  companyId: string,
  opts?: { nameIfCreate?: string; nameIfUpdate?: string }
) {
  const key = String(identifier ?? "").trim();
  if (!key) throw new Error("employee identifier is required");

  const existing = await findEmployeeByAnyId(key, companyId);
  if (existing) {
    if (opts?.nameIfUpdate && opts.nameIfUpdate !== existing.name) {
      return prisma.employee.update({
        where: { id: existing.id },
        data: { name: opts.nameIfUpdate },
      });
    }
    return existing;
  }

  return prisma.employee.create({
    data: {
      empId: key,
      name: opts?.nameIfCreate ?? "Unknown",
      companyId,
    },
  });
}

export function employeePublicId(e: { id: string; empId?: string | null }) {
  const v = String(e.empId ?? "").trim();
  return v || e.id;
}

