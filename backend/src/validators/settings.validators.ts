import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

const relayUrlField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine(
    (value) => value === undefined || value === null || isHttpUrl(value),
    "Must be a valid http(s) URL"
  );

export const relaySettingsUpdateSchema = z
  .object({
    relayOnUrl: relayUrlField.optional(),
    relaySilentUrl: relayUrlField.optional(),
    relay_on_url: relayUrlField.optional(),
    relay_silent_url: relayUrlField.optional(),
  })
  .transform((value) => ({
    relayOnUrl:
      value.relayOnUrl !== undefined ? value.relayOnUrl : value.relay_on_url,
    relaySilentUrl:
      value.relaySilentUrl !== undefined
        ? value.relaySilentUrl
        : value.relay_silent_url,
  }))
  .refine(
    (value) =>
      value.relayOnUrl !== undefined || value.relaySilentUrl !== undefined,
    { message: "Nothing to update" }
  );

export type RelaySettingsUpdateInput = z.infer<typeof relaySettingsUpdateSchema>;
