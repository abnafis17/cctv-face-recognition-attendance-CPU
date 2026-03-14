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

const erpUrlField = z
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

const erpPrefixField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  });

const erpEndpointField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (isHttpUrl(trimmed)) return trimmed;
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  })
  .refine(
    (value) =>
      value === undefined ||
      value === null ||
      isHttpUrl(value) ||
      value.startsWith("/"),
    "Must be a valid http(s) URL or path starting with '/'"
  );

export const erpSettingsUpdateSchema = z
  .object({
    erpBaseUrl: erpUrlField.optional(),
    erpPrefix: erpPrefixField.optional(),
    erpAttendanceEndpoint: erpEndpointField.optional(),
    erp_base_url: erpUrlField.optional(),
    erp_prefix: erpPrefixField.optional(),
    erp_attendance_endpoint: erpEndpointField.optional(),
  })
  .transform((value) => ({
    erpBaseUrl:
      value.erpBaseUrl !== undefined ? value.erpBaseUrl : value.erp_base_url,
    erpPrefix:
      value.erpPrefix !== undefined ? value.erpPrefix : value.erp_prefix,
    erpAttendanceEndpoint:
      value.erpAttendanceEndpoint !== undefined
        ? value.erpAttendanceEndpoint
        : value.erp_attendance_endpoint,
  }))
  .refine(
    (value) =>
      value.erpBaseUrl !== undefined ||
      value.erpPrefix !== undefined ||
      value.erpAttendanceEndpoint !== undefined,
    { message: "Nothing to update" }
  );

export type ErpSettingsUpdateInput = z.infer<typeof erpSettingsUpdateSchema>;
