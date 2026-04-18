import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";
import { findCameraByAnyId } from "../utils/camera";
import { employeePublicId } from "../utils/employee";
import type {
  CameraCreateInput as CameraCreatePayload,
  CameraUpdateInput as CameraUpdatePayload,
} from "../validators/camera.validators";

type ListCompanyCamerasOptions = {
  includeVirtual?: boolean;
  task?: string | null;
};
const cameraHasAttendanceField = Prisma.dmmf.datamodel.models
  .find((m) => m.name === "Camera")
  ?.fields.some((f) => f.name === "attendance");
const cameraHasTaskField = Prisma.dmmf.datamodel.models
  .find((m) => m.name === "Camera")
  ?.fields.some((f) => f.name === "task");

export class CameraAuthorizedEmployeesValidationError extends Error {
  invalidEmployeeIds: string[];

  constructor(invalidEmployeeIds: string[]) {
    super("Some employees are invalid or not enrolled");
    this.name = "CameraAuthorizedEmployeesValidationError";
    this.invalidEmployeeIds = invalidEmployeeIds;
  }
}

type CameraAuthorizedStateCamera = {
  id: string;
  camId: string | null;
  name: string;
};

type CameraAuthorizedStateEmployee = {
  id: string;
  empId: string | null;
  publicId: string;
  name: string;
  unit: string | null;
  section: string | null;
  department: string | null;
  line: string | null;
  selected: boolean;
};

export type CameraAuthorizedEmployeesState = {
  camera: CameraAuthorizedStateCamera;
  employees: CameraAuthorizedStateEmployee[];
  authorizedEmployeeIds: string[];
  authorizedEmployeePublicIds: string[];
};

function normalizeCameraTask(value: unknown): string | null {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (normalized === "gatepass") return "gate_pass";
  if (normalized === "gate pass") return "gate_pass";
  return normalized;
}

function cameraListWhere(
  companyId: string,
  options?: ListCompanyCamerasOptions,
): Prisma.CameraWhereInput {
  const includeVirtual = Boolean(options?.includeVirtual);
  const task = normalizeCameraTask(options?.task);

  const where: Prisma.CameraWhereInput = {
    companyId,
    ...(includeVirtual
      ? {}
      : {
          AND: [
            { id: { not: { startsWith: "laptop-" } } },
            {
              OR: [
                { camId: null },
                { camId: { not: { startsWith: "laptop-" } } },
              ],
            },
          ],
        }),
  };

  if (cameraHasTaskField && task) {
    (where as any).task = task;
  }

  return where;
}

export async function listCompanyCameras(
  companyId: string,
  options?: ListCompanyCamerasOptions,
) {
  return prisma.camera.findMany({
    where: cameraListWhere(companyId, options),
    orderBy: [{ isActive: "desc" }, { name: "asc" }, { createdAt: "desc" }],
  });
}

export async function createCompanyCamera(
  companyId: string,
  payload: CameraCreatePayload,
) {
  const task = normalizeCameraTask(payload.task) ?? "attendance";
  const data: Prisma.CameraUncheckedCreateInput = {
    name: payload.name,
    rtspUrl: payload.rtspUrl,
    companyId,
    isActive: false,
    attendance: task === "attendance",
    ...(payload.camId ? { camId: payload.camId } : {}),
    ...(payload.relayAgentId !== undefined
      ? { relayAgentId: payload.relayAgentId }
      : {}),
    ...(payload.rtspUrlEnc !== undefined
      ? { rtspUrlEnc: payload.rtspUrlEnc }
      : {}),
    ...(payload.sendFps !== undefined ? { sendFps: payload.sendFps } : {}),
    ...(payload.sendWidth !== undefined
      ? { sendWidth: payload.sendWidth }
      : {}),
    ...(payload.sendHeight !== undefined
      ? { sendHeight: payload.sendHeight }
      : {}),
    ...(payload.jpegQuality !== undefined
      ? { jpegQuality: payload.jpegQuality }
      : {}),
  };

  if (cameraHasTaskField) {
    (data as any).task = task;
  }

  return prisma.camera.create({
    data: data as any,
  });
}

export async function updateCompanyCamera(
  companyId: string,
  anyId: string,
  payload: CameraUpdatePayload,
) {
  const existing = await findCameraByAnyId(anyId, companyId);
  if (!existing) return null;

  const data: Prisma.CameraUncheckedUpdateInput = {};

  if (payload.camId !== undefined) data.camId = payload.camId;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.rtspUrl !== undefined) data.rtspUrl = payload.rtspUrl;
  if (payload.relayAgentId !== undefined)
    data.relayAgentId = payload.relayAgentId;
  if (payload.rtspUrlEnc !== undefined) data.rtspUrlEnc = payload.rtspUrlEnc;
  if (payload.sendFps !== undefined) data.sendFps = payload.sendFps;
  if (payload.sendWidth !== undefined) data.sendWidth = payload.sendWidth;
  if (payload.sendHeight !== undefined) data.sendHeight = payload.sendHeight;
  if (payload.jpegQuality !== undefined) data.jpegQuality = payload.jpegQuality;
  if (payload.isActive !== undefined) data.isActive = payload.isActive;
  if (cameraHasTaskField && payload.task !== undefined) {
    const task = normalizeCameraTask(payload.task);
    if (task) {
      (data as any).task = task;
      if (cameraHasAttendanceField && task !== "attendance") {
        data.attendance = false;
      }
    }
  }

  return prisma.camera.update({
    where: { id: existing.id },
    data: data as any,
  });
}

export async function deleteCompanyCamera(companyId: string, anyId: string) {
  const existing = await findCameraByAnyId(anyId, companyId);
  if (!existing) return null;

  await prisma.camera.delete({ where: { id: existing.id } });
  return existing;
}

function normalizeDistinctEmployeeIds(ids: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of ids) {
    const id = String(raw ?? "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }

  return out;
}

function toCameraStateCamera(input: { id: string; camId: string | null; name: string }) {
  return {
    id: input.id,
    camId: input.camId,
    name: input.name,
  };
}

async function loadCameraAuthorizedEmployeesState(params: {
  companyId: string;
  camera: {
    id: string;
    camId: string | null;
    name: string;
  };
}) {
  const { companyId, camera } = params;

  const [enrolledEmployees, assignedRows] = await Promise.all([
    prisma.employee.findMany({
      where: {
        companyId,
        templates: { some: {} },
      },
      select: {
        id: true,
        empId: true,
        name: true,
        unit: true,
        section: true,
        department: true,
        line: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    }),
    prisma.cameraAuthorizedEmployee.findMany({
      where: { cameraId: camera.id },
      include: {
        employee: {
          select: {
            id: true,
            empId: true,
            name: true,
          },
        },
      },
      orderBy: [{ employee: { name: "asc" } }],
    }),
  ]);

  const authorizedEmployeeIds = normalizeDistinctEmployeeIds(
    assignedRows.map((row) => row.employeeId)
  );
  const authorizedSet = new Set(authorizedEmployeeIds);
  const authorizedEmployeePublicIds = normalizeDistinctEmployeeIds(
    assignedRows.map((row) => employeePublicId(row.employee))
  );

  const employees: CameraAuthorizedStateEmployee[] = enrolledEmployees.map((row) => ({
    id: row.id,
    empId: row.empId ?? null,
    publicId: employeePublicId(row),
    name: row.name,
    unit: row.unit ?? null,
    section: row.section ?? null,
    department: row.department ?? null,
    line: row.line ?? null,
    selected: authorizedSet.has(row.id),
  }));

  const state: CameraAuthorizedEmployeesState = {
    camera: toCameraStateCamera(camera),
    employees,
    authorizedEmployeeIds,
    authorizedEmployeePublicIds,
  };
  return state;
}

export async function listCompanyCameraAuthorizedEmployees(
  companyId: string,
  anyId: string
) {
  const camera = await findCameraByAnyId(anyId, companyId);
  if (!camera) return null;

  return loadCameraAuthorizedEmployeesState({
    companyId,
    camera: {
      id: camera.id,
      camId: camera.camId ?? null,
      name: camera.name,
    },
  });
}

export async function updateCompanyCameraAuthorizedEmployees(
  companyId: string,
  anyId: string,
  employeeIds: string[]
) {
  const camera = await findCameraByAnyId(anyId, companyId);
  if (!camera) return null;

  const normalizedIds = normalizeDistinctEmployeeIds(employeeIds);

  if (normalizedIds.length > 0) {
    const validEmployees = await prisma.employee.findMany({
      where: {
        companyId,
        id: { in: normalizedIds },
        templates: { some: {} },
      },
      select: { id: true },
    });

    const validSet = new Set(validEmployees.map((row) => row.id));
    const invalidEmployeeIds = normalizedIds.filter((id) => !validSet.has(id));
    if (invalidEmployeeIds.length > 0) {
      throw new CameraAuthorizedEmployeesValidationError(invalidEmployeeIds);
    }
  }

  await prisma.$transaction(async (tx) => {
    if (normalizedIds.length === 0) {
      await tx.cameraAuthorizedEmployee.deleteMany({
        where: { cameraId: camera.id },
      });
      return;
    }

    await tx.cameraAuthorizedEmployee.deleteMany({
      where: {
        cameraId: camera.id,
        employeeId: { notIn: normalizedIds },
      },
    });

    await tx.cameraAuthorizedEmployee.createMany({
      data: normalizedIds.map((employeeId) => ({
        cameraId: camera.id,
        employeeId,
      })),
      skipDuplicates: true,
    });
  });

  return loadCameraAuthorizedEmployeesState({
    companyId,
    camera: {
      id: camera.id,
      camId: camera.camId ?? null,
      name: camera.name,
    },
  });
}

export async function listCameraAuthorizedEmployeePublicIds(cameraId: string) {
  const cameraKey = String(cameraId ?? "").trim();
  if (!cameraKey) return [];

  const rows = await prisma.cameraAuthorizedEmployee.findMany({
    where: { cameraId: cameraKey },
    include: {
      employee: {
        select: {
          id: true,
          empId: true,
        },
      },
    },
    orderBy: [{ employeeId: "asc" }],
  });

  return normalizeDistinctEmployeeIds(rows.map((row) => employeePublicId(row.employee)));
}
