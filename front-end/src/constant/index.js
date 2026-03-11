// src/constant/index.js

export const HOST =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:3001";

// Keep one canonical backend prefix env across frontend modules.
const rawBackendApiPrefix =
  process.env.NEXT_PUBLIC_BACKEND_API_PREFIX || "/api/v1";
export const BACKEND_API_PREFIX = rawBackendApiPrefix.startsWith("/")
  ? rawBackendApiPrefix
  : `/${rawBackendApiPrefix}`;
export const BACKEND_API_BASE = `${HOST}${BACKEND_API_PREFIX}`;

export const AI_HOST = process.env.NEXT_PUBLIC_AI_URL || "";

// If your AI server also uses "/api", change to: `${AI_HOST}/api`
export const AI_API_BASE = `${AI_HOST}`;

export const ERP_HOST = process.env.NEXT_PUBLIC_ERP_URL || "";

export const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_URL || "";
export const CLIENT_ADDRESS = process.env.NEXT_PUBLIC_CLIENT_ADDRESS || "";
