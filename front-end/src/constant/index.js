// src/constant/index.js

export const HOST = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// ✅ Common backend API base so you don't repeat "/api" everywhere
export const BACKEND_API_BASE = `${HOST}/api/v1`;

export const AI_HOST = process.env.NEXT_PUBLIC_AI_URL || "";

// ✅ If your AI server also uses "/api", change to: `${AI_HOST}/api`
export const AI_API_BASE = `${AI_HOST}`;

export const ERP_HOST = process.env.NEXT_PUBLIC_ERP_URL || "";

export const MEDIA_HOST = process.env.NEXT_PUBLIC_MEDIA_URL || "";
export const CLIENT_ADDRESS = process.env.NEXT_PUBLIC_CLIENT_ADDRESS || "";
