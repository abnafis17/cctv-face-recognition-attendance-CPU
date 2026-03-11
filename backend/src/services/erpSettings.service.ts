import { prisma } from "../prisma";
import type { ErpSettingsUpdateInput } from "../validators/settings.validators";

export type ErpSettingsDto = {
  id: string | null;
  erpBaseUrl: string | null;
  erpPrefix: string | null;
  erpAttendanceEndpoint: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export async function getCompanyErpSettings(
  companyId: string
): Promise<ErpSettingsDto> {
  const row = await prisma.companyErpSetting.findUnique({
    where: { companyId },
    select: {
      id: true,
      erpBaseUrl: true,
      erpPrefix: true,
      erpAttendanceEndpoint: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const erpBaseUrl = row?.erpBaseUrl ?? null;
  const erpPrefix = row?.erpPrefix ?? null;
  const erpAttendanceEndpoint = row?.erpAttendanceEndpoint ?? null;
  const hasErpConfig =
    Boolean(String(erpBaseUrl ?? "").trim()) ||
    Boolean(String(erpPrefix ?? "").trim()) ||
    Boolean(String(erpAttendanceEndpoint ?? "").trim());
  if (!hasErpConfig) {
    return {
      id: null,
      erpBaseUrl: null,
      erpPrefix: null,
      erpAttendanceEndpoint: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    id: row?.id ?? null,
    erpBaseUrl,
    erpPrefix,
    erpAttendanceEndpoint,
    createdAt: row?.createdAt?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export async function upsertCompanyErpSettings(
  companyId: string,
  payload: ErpSettingsUpdateInput
): Promise<ErpSettingsDto> {
  const row = await prisma.companyErpSetting.upsert({
    where: { companyId },
    create: {
      companyId,
      erpBaseUrl: payload.erpBaseUrl !== undefined ? payload.erpBaseUrl : null,
      erpPrefix: payload.erpPrefix !== undefined ? payload.erpPrefix : null,
      erpAttendanceEndpoint:
        payload.erpAttendanceEndpoint !== undefined
          ? payload.erpAttendanceEndpoint
          : null,
    },
    update: {
      ...(payload.erpBaseUrl !== undefined
        ? { erpBaseUrl: payload.erpBaseUrl }
        : {}),
      ...(payload.erpPrefix !== undefined ? { erpPrefix: payload.erpPrefix } : {}),
      ...(payload.erpAttendanceEndpoint !== undefined
        ? { erpAttendanceEndpoint: payload.erpAttendanceEndpoint }
        : {}),
    },
    select: {
      id: true,
      erpBaseUrl: true,
      erpPrefix: true,
      erpAttendanceEndpoint: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: row.id,
    erpBaseUrl: row.erpBaseUrl ?? null,
    erpPrefix: row.erpPrefix ?? null,
    erpAttendanceEndpoint: row.erpAttendanceEndpoint ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteCompanyErpSettings(companyId: string): Promise<boolean> {
  const existing = await prisma.companyErpSetting.findUnique({
    where: { companyId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.companyErpSetting.delete({
    where: { companyId },
  });
  return true;
}
