import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../prisma";
import {
  GatepassCreateInput,
  GatepassListQueryInput,
  GatepassReturnInput,
  gatepassCreateSchema,
  gatepassListQuerySchema,
  gatepassReturnSchema,
} from "../validators/gatepass.validators";
import { findEmployeeByAnyId } from "../utils/employee";
import { findCameraByAnyId } from "../utils/camera";

type GatepassJoinedRow = {
  id: string;
  companyId: string;
  employeeId: string;
  leaveType: string;
  purpose: string;
  destination: string | null;
  outTime: Date;
  inTime: Date | null;
  status: string;
  requestCameraId: string | null;
  returnCameraId: string | null;
  externalSubmitAckAt: Date | null;
  externalReturnAckAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  employeePkId: string;
  employeeEmpId: string | null;
  employeeName: string;
  employeeDepartment: string | null;
  employeeUnit: string | null;
  employeeLine: string | null;
  employeeSection: string | null;
  requestCameraName: string | null;
  returnCameraName: string | null;
};

function getCompanyId(req: Request): string {
  return String((req as any).companyId ?? "").trim();
}

function dhakaTodayYYYYMMDD() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
}

function dhakaDayRange(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00+06:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function parseInputDate(value: string | undefined, field: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} must be a valid datetime`);
  }
  return parsed;
}

function respondValidationError(res: Response, error: ZodError) {
  const first = error.issues?.[0];
  const message =
    first?.message ||
    (first?.path?.length ? `${first.path.join(".")} is invalid` : "Invalid input");

  return res.status(400).json({
    error: message,
    issues: error.issues,
  });
}

function sqlLikePattern(value: string) {
  return `%${String(value ?? "").trim()}%`;
}

const GATEPASS_SELECT = Prisma.sql`
SELECT
  gp."id",
  gp."companyId",
  gp."employeeId",
  gp."leaveType",
  gp."purpose",
  gp."destination",
  gp."outTime",
  gp."inTime",
  gp."status",
  gp."requestCameraId",
  gp."returnCameraId",
  gp."externalSubmitAckAt",
  gp."externalReturnAckAt",
  gp."createdAt",
  gp."updatedAt",
  e."id" AS "employeePkId",
  e."emp_id" AS "employeeEmpId",
  e."name" AS "employeeName",
  e."department" AS "employeeDepartment",
  e."unit" AS "employeeUnit",
  e."line" AS "employeeLine",
  e."section" AS "employeeSection",
  reqCam."name" AS "requestCameraName",
  retCam."name" AS "returnCameraName"
FROM "GatepassTable" gp
JOIN "Employee" e ON e."id" = gp."employeeId"
LEFT JOIN "Camera" reqCam ON reqCam."id" = gp."requestCameraId"
LEFT JOIN "Camera" retCam ON retCam."id" = gp."returnCameraId"
`;

function serializeGatepass(row: GatepassJoinedRow) {
  const employeeCode = String(row.employeeEmpId ?? "").trim() || row.employeePkId;
  const designation =
    String((row as any)?.employeeDesignation ?? "").trim() ||
    String(row.employeeLine ?? "").trim() ||
    String(row.employeeSection ?? "").trim() ||
    null;

  return {
    id: row.id,
    companyId: row.companyId,
    employeePkId: row.employeePkId,
    employeeId: employeeCode,
    employeeName: row.employeeName,
    department: row.employeeDepartment,
    designation,
    unit: row.employeeUnit,
    leaveType: row.leaveType === "long" ? "long" : "short",
    purpose: row.purpose,
    destination: row.destination,
    status: row.status === "returned" ? "returned" : "out",
    outTime: row.outTime.toISOString(),
    inTime: row.inTime ? row.inTime.toISOString() : null,
    requestedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    requestCameraId: row.requestCameraId,
    requestCameraName: row.requestCameraName,
    returnCameraId: row.returnCameraId,
    returnCameraName: row.returnCameraName,
    externalSubmitAckAt: row.externalSubmitAckAt
      ? row.externalSubmitAckAt.toISOString()
      : null,
    externalReturnAckAt: row.externalReturnAckAt
      ? row.externalReturnAckAt.toISOString()
      : null,
  };
}

async function loadGatepassById(companyId: string, gatepassId: string) {
  const rows = await prisma.$queryRaw<GatepassJoinedRow[]>(
    Prisma.sql`${GATEPASS_SELECT}
      WHERE gp."companyId" = ${companyId}
        AND gp."id" = ${gatepassId}
      LIMIT 1`,
  );
  return rows[0] ?? null;
}

async function callDemoFinalApi(payload: Record<string, unknown>) {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 150);
  });

  return {
    ok: true,
    provider: "demo-final-api",
    referenceId: `DEMO-${Date.now()}`,
    acknowledgedAt: new Date().toISOString(),
    payload,
  };
}

function normalizeCreateInput(req: Request): GatepassCreateInput {
  return gatepassCreateSchema.parse({
    employeeId: req.body?.employeeId,
    leaveType: req.body?.leaveType,
    purpose: req.body?.purpose,
    destination: req.body?.destination,
    cameraId: req.body?.cameraId,
    recognizedAt: req.body?.recognizedAt,
  });
}

function normalizeReturnInput(req: Request): GatepassReturnInput {
  return gatepassReturnSchema.parse({
    employeeId: req.body?.employeeId,
    cameraId: req.body?.cameraId,
    recognizedAt: req.body?.recognizedAt,
  });
}

function normalizeListQuery(req: Request): GatepassListQueryInput {
  return gatepassListQuerySchema.parse({
    date: req.query?.date,
    fromDate: req.query?.fromDate ?? req.query?.from,
    toDate: req.query?.toDate ?? req.query?.to,
    leaveType: req.query?.leaveType,
    status: req.query?.status,
    q: req.query?.q,
    limit: req.query?.limit,
  });
}

export async function listGatepassRecords(req: Request, res: Response) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const query = normalizeListQuery(req);
    const fromDateStr =
      query.fromDate || query.date || query.toDate || dhakaTodayYYYYMMDD();
    const toDateStr =
      query.toDate || query.date || query.fromDate || dhakaTodayYYYYMMDD();

    if (fromDateStr > toDateStr) {
      return res.status(400).json({
        error: "fromDate must be earlier than or equal to toDate",
      });
    }

    const { start } = dhakaDayRange(fromDateStr);
    const { end } = dhakaDayRange(toDateStr);
    const limit = query.limit || 300;

    const whereClauses: Prisma.Sql[] = [
      Prisma.sql`gp."companyId" = ${companyId}`,
      Prisma.sql`gp."outTime" >= ${start}`,
      Prisma.sql`gp."outTime" < ${end}`,
    ];

    if (query.leaveType) {
      whereClauses.push(Prisma.sql`gp."leaveType" = ${query.leaveType}`);
    }
    if (query.status) {
      whereClauses.push(Prisma.sql`gp."status" = ${query.status}`);
    }
    if (query.q) {
      const like = sqlLikePattern(query.q);
      whereClauses.push(
        Prisma.sql`(
          e."name" ILIKE ${like}
          OR COALESCE(e."emp_id", '') ILIKE ${like}
          OR e."id" ILIKE ${like}
        )`,
      );
    }

    const rows = await prisma.$queryRaw<GatepassJoinedRow[]>(
      Prisma.sql`${GATEPASS_SELECT}
        WHERE ${Prisma.join(whereClauses, " AND ")}
        ORDER BY gp."outTime" ASC, gp."createdAt" ASC
        LIMIT ${limit}`,
    );

    return res.json(rows.map(serializeGatepass));
  } catch (error: unknown) {
    if (error instanceof ZodError) return respondValidationError(res, error);
    return res.status(500).json({
      error: "Failed to load gatepass records",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createGatepassRecord(req: Request, res: Response) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const payload = normalizeCreateInput(req);
    const recognizedAt =
      parseInputDate(payload.recognizedAt ?? undefined, "recognizedAt") ?? new Date();

    const employee = await findEmployeeByAnyId(payload.employeeId, companyId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found for this company" });
    }

    const camera = payload.cameraId
      ? await findCameraByAnyId(payload.cameraId, companyId)
      : null;
    if (payload.cameraId && !camera) {
      return res.status(404).json({ error: "Camera not found for this company" });
    }

    const gatepassId = randomUUID();
    const createdAt = new Date();

    await prisma.$executeRaw(
      Prisma.sql`
      INSERT INTO "GatepassTable" (
        "id",
        "companyId",
        "employeeId",
        "leaveType",
        "purpose",
        "destination",
        "outTime",
        "inTime",
        "status",
        "requestCameraId",
        "returnCameraId",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${gatepassId},
        ${companyId},
        ${employee.id},
        ${payload.leaveType},
        ${payload.purpose.trim()},
        ${payload.destination ?? null},
        ${recognizedAt},
        ${null},
        ${"out"},
        ${camera?.id ?? null},
        ${null},
        ${createdAt},
        ${createdAt}
      )`,
    );

    let demoApi: Record<string, unknown> | null = null;
    if (payload.leaveType === "long") {
      demoApi = await callDemoFinalApi({
        phase: "long_leave_submit",
        gatepassId,
        employeeId: employee.empId ?? employee.id,
        outTime: recognizedAt.toISOString(),
      });

      await prisma.$executeRaw(
        Prisma.sql`
          UPDATE "GatepassTable"
          SET
            "externalSubmitAckAt" = ${new Date()},
            "externalSubmitPayload" = CAST(${JSON.stringify(demoApi)} AS jsonb),
            "updatedAt" = ${new Date()}
          WHERE "id" = ${gatepassId}
            AND "companyId" = ${companyId}
        `,
      );
    }

    const row = await loadGatepassById(companyId, gatepassId);
    if (!row) return res.status(404).json({ error: "Gatepass record not found" });

    return res.status(201).json({
      ok: true,
      gatepass: serializeGatepass(row),
      demoApiCalled: payload.leaveType === "long",
      demoApi,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) return respondValidationError(res, error);
    if (error instanceof Error && error.message.includes("recognizedAt")) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Failed to create gatepass request",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function markGatepassReturn(req: Request, res: Response) {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const payload = normalizeReturnInput(req);
    const recognizedAt =
      parseInputDate(payload.recognizedAt ?? undefined, "recognizedAt") ?? new Date();

    const employee = await findEmployeeByAnyId(payload.employeeId, companyId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found for this company" });
    }

    const camera = payload.cameraId
      ? await findCameraByAnyId(payload.cameraId, companyId)
      : null;
    if (payload.cameraId && !camera) {
      return res.status(404).json({ error: "Camera not found for this company" });
    }

    const openRows = await prisma.$queryRaw<
      Array<{ id: string; outTime: Date; leaveType: string }>
    >(
      Prisma.sql`
        SELECT "id", "outTime", "leaveType"
        FROM "GatepassTable"
        WHERE "companyId" = ${companyId}
          AND "employeeId" = ${employee.id}
          AND "status" = ${"out"}
          AND "inTime" IS NULL
        ORDER BY "outTime" DESC
        LIMIT 1
      `,
    );
    const openGatepass = openRows[0];

    if (!openGatepass) {
      return res.json({ ok: true, updated: false, reason: "no_open_gatepass" });
    }

    const demoApi = await callDemoFinalApi({
      phase: "gatepass_return",
      gatepassId: openGatepass.id,
      employeeId: employee.empId ?? employee.id,
      leaveType: openGatepass.leaveType,
      inTime: recognizedAt.toISOString(),
    });

    await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "GatepassTable"
        SET
          "inTime" = ${recognizedAt},
          "status" = ${"returned"},
          "returnCameraId" = ${camera?.id ?? null},
          "externalReturnAckAt" = ${new Date()},
          "externalReturnPayload" = CAST(${JSON.stringify(demoApi)} AS jsonb),
          "updatedAt" = ${new Date()}
        WHERE "id" = ${openGatepass.id}
          AND "companyId" = ${companyId}
      `,
    );

    const updated = await loadGatepassById(companyId, openGatepass.id);
    if (!updated) {
      return res.status(404).json({ error: "Updated gatepass record not found" });
    }

    return res.json({
      ok: true,
      updated: true,
      gatepass: serializeGatepass(updated),
      demoApiCalled: true,
      demoApi,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) return respondValidationError(res, error);
    if (error instanceof Error && error.message.includes("recognizedAt")) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({
      error: "Failed to mark gatepass return",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
