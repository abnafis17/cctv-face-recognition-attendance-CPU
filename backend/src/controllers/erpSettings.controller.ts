import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { erpSettingsUpdateSchema } from "../validators/settings.validators";
import {
  deleteCompanyErpSettings,
  getCompanyErpSettings,
  upsertCompanyErpSettings,
} from "../services/erpSettings.service";

function companyIdFromReq(req: Request): string {
  return String((req as any).companyId ?? "").trim();
}

function validationErrorMessage(error: ZodError): string {
  const first = error.issues?.[0];
  return (
    first?.message ||
    (first?.path?.length ? `${first.path.join(".")} is invalid` : "Invalid input")
  );
}

export async function getErpSettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const settings = await getCompanyErpSettings(companyId);
    return res.json(settings);
  } catch (error: unknown) {
    return res.status(500).json({
      error: "Failed to load ERP settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateErpSettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const payload = erpSettingsUpdateSchema.parse(req.body ?? {});
    const settings = await upsertCompanyErpSettings(companyId, payload);
    return res.json(settings);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: validationErrorMessage(error),
        issues: error.issues,
      });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return res.status(400).json({ error: "Invalid company id" });
      }
    }
    return res.status(500).json({
      error: "Failed to update ERP settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function deleteErpSettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const deleted = await deleteCompanyErpSettings(companyId);
    return res.json({ ok: true, deleted });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return res.status(400).json({ error: "Invalid company id" });
      }
    }
    return res.status(500).json({
      error: "Failed to delete ERP settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
