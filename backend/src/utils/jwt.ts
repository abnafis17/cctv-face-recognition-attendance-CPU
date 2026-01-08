// src/utils/jwt.ts
import jwt, {
  type Secret,
  type SignOptions,
  type JwtPayload as JwtStdPayload,
} from "jsonwebtoken";

export type AccessTokenPayload = {
  sub: string; // user id
  email: string;
  role: string;
  companyId: string;
};

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getAccessExpiresIn(): SignOptions["expiresIn"] {
  // jsonwebtoken v9 types expect SignOptions["expiresIn"]
  return (process.env.ACCESS_TOKEN_EXPIRES ??
    "15m") as SignOptions["expiresIn"];
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const secret: Secret = requireEnv("ACCESS_TOKEN_SECRET");
  const options: SignOptions = { expiresIn: getAccessExpiresIn() };

  return jwt.sign(payload, secret, options);
}

function isAccessTokenPayload(
  v: unknown
): v is JwtStdPayload & AccessTokenPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as any;

  // our required fields
  return (
    typeof o.sub === "string" &&
    typeof o.email === "string" &&
    typeof o.role === "string" &&
    typeof o.companyId === "string"
  );
}

/**
 * Verifies and returns a strongly typed payload.
 * Throws if invalid/expired or payload doesn't match our expected structure.
 */
export function verifyAccessToken(
  token: string
): JwtStdPayload & AccessTokenPayload {
  const secret: Secret = requireEnv("ACCESS_TOKEN_SECRET");

  const decoded = jwt.verify(token, secret); // string | JwtPayload

  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }

  if (!isAccessTokenPayload(decoded)) {
    throw new Error("Token payload missing required fields");
  }

  return decoded;
}
