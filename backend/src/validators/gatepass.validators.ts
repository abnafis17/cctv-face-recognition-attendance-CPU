import { z } from "zod";

const DATE_YYYY_MM_DD = /^\d{4}-\d{2}-\d{2}$/;

function normalizeLeaveType(value: unknown): unknown {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (!normalized) return value;
  if (normalized === "short_leave") return "short";
  if (normalized === "long_leave") return "long";
  return normalized;
}

function normalizeOptionalStatus(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

function optionalTrimmedString(maxLength: number) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return null;
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }, z.string().max(maxLength).nullable());
}

export const gatepassCreateSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee is required").max(191),
  leaveType: z.preprocess(
    normalizeLeaveType,
    z.enum(["short", "long"], {
      error: "Leave type must be short or long",
    }),
  ),
  purpose: z
    .string()
    .trim()
    .min(1, "Purpose is required")
    .max(1000, "Purpose must be within 1000 characters"),
  destination: optionalTrimmedString(255).optional(),
  cameraId: optionalTrimmedString(191).optional(),
  recognizedAt: z.string().trim().min(1).max(64).optional(),
});

export const gatepassReturnSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee is required").max(191),
  cameraId: optionalTrimmedString(191).optional(),
  recognizedAt: z.string().trim().min(1).max(64).optional(),
});

export const gatepassListQuerySchema = z.object({
  date: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null) return undefined;
        const normalized = String(value).trim();
        return normalized.length > 0 ? normalized : undefined;
      },
      z.string().regex(DATE_YYYY_MM_DD, "date must be YYYY-MM-DD").optional(),
    )
    .optional(),
  fromDate: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null) return undefined;
        const normalized = String(value).trim();
        return normalized.length > 0 ? normalized : undefined;
      },
      z.string().regex(DATE_YYYY_MM_DD, "fromDate must be YYYY-MM-DD").optional(),
    )
    .optional(),
  toDate: z
    .preprocess(
      (value) => {
        if (value === undefined || value === null) return undefined;
        const normalized = String(value).trim();
        return normalized.length > 0 ? normalized : undefined;
      },
      z.string().regex(DATE_YYYY_MM_DD, "toDate must be YYYY-MM-DD").optional(),
    )
    .optional(),
  leaveType: z.preprocess(
    (value) => {
      const normalized = normalizeLeaveType(value);
      if (normalized === undefined || normalized === null) return undefined;
      const asString = String(normalized).trim();
      return asString.length > 0 ? normalized : undefined;
    },
    z.enum(["short", "long"]).optional(),
  ),
  status: z.preprocess(
    normalizeOptionalStatus,
    z.enum(["out", "returned"]).optional(),
  ),
  q: z.preprocess(
    (value) => {
      if (value === undefined || value === null) return undefined;
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : undefined;
    },
    z.string().max(191).optional(),
  ),
  limit: z.preprocess(
    (value) => {
      if (value === undefined || value === null) return undefined;
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : undefined;
    },
    z.coerce.number().int().min(1).max(500).optional(),
  ),
});

export const gatepassIdParamSchema = z.object({
  id: z.string().trim().min(1).max(191),
});

export type GatepassCreateInput = z.infer<typeof gatepassCreateSchema>;
export type GatepassReturnInput = z.infer<typeof gatepassReturnSchema>;
export type GatepassListQueryInput = z.infer<typeof gatepassListQuerySchema>;
