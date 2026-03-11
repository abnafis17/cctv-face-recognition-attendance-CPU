import { prisma } from "../prisma";
import type { RelaySettingsUpdateInput } from "../validators/settings.validators";

export type RelaySettingsDto = {
  id: string | null;
  relayOnUrl: string | null;
  relaySilentUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export async function getCompanyRelaySettings(
  companyId: string
): Promise<RelaySettingsDto> {
  const row = await prisma.companyRelaySetting.findUnique({
    where: { companyId },
    select: {
      id: true,
      relayOnUrl: true,
      relaySilentUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const relayOnUrl = row?.relayOnUrl ?? null;
  const relaySilentUrl = row?.relaySilentUrl ?? null;
  const hasRelayConfig =
    Boolean(String(relayOnUrl ?? "").trim()) ||
    Boolean(String(relaySilentUrl ?? "").trim());
  if (!hasRelayConfig) {
    return {
      id: null,
      relayOnUrl: null,
      relaySilentUrl: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  return {
    id: row?.id ?? null,
    relayOnUrl,
    relaySilentUrl,
    createdAt: row?.createdAt?.toISOString() ?? null,
    updatedAt: row?.updatedAt?.toISOString() ?? null,
  };
}

export async function upsertCompanyRelaySettings(
  companyId: string,
  payload: RelaySettingsUpdateInput
): Promise<RelaySettingsDto> {
  const row = await prisma.companyRelaySetting.upsert({
    where: { companyId },
    create: {
      companyId,
      relayOnUrl:
        payload.relayOnUrl !== undefined ? payload.relayOnUrl : null,
      relaySilentUrl:
        payload.relaySilentUrl !== undefined ? payload.relaySilentUrl : null,
    },
    update: {
      ...(payload.relayOnUrl !== undefined
        ? { relayOnUrl: payload.relayOnUrl }
        : {}),
      ...(payload.relaySilentUrl !== undefined
        ? { relaySilentUrl: payload.relaySilentUrl }
        : {}),
    },
    select: {
      id: true,
      relayOnUrl: true,
      relaySilentUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    id: row.id,
    relayOnUrl: row.relayOnUrl ?? null,
    relaySilentUrl: row.relaySilentUrl ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteCompanyRelaySettings(companyId: string): Promise<boolean> {
  const existing = await prisma.companyRelaySetting.findUnique({
    where: { companyId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.companyRelaySetting.delete({
    where: { companyId },
  });
  return true;
}
