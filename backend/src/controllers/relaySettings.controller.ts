import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { ZodError } from "zod";
import { relaySettingsUpdateSchema } from "../validators/settings.validators";
import {
  deleteCompanyRelaySettings,
  getCompanyRelaySettings,
  upsertCompanyRelaySettings,
} from "../services/relaySettings.service";

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

export async function getRelaySettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const settings = await getCompanyRelaySettings(companyId);
    return res.json(settings);
  } catch (error: unknown) {
    return res.status(500).json({
      error: "Failed to load relay settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateRelaySettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const payload = relaySettingsUpdateSchema.parse(req.body ?? {});
    const settings = await upsertCompanyRelaySettings(companyId, payload);
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
      error: "Failed to update relay settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function deleteRelaySettings(req: Request, res: Response) {
  try {
    const companyId = companyIdFromReq(req);
    if (!companyId) return res.status(400).json({ error: "Missing company id" });

    const deleted = await deleteCompanyRelaySettings(companyId);
    return res.json({ ok: true, deleted });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return res.status(400).json({ error: "Invalid company id" });
      }
    }
    return res.status(500).json({
      error: "Failed to delete relay settings",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
