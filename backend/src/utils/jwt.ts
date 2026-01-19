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

export type AgentTokenPayload = {
  sub: string; // agentId
  companyId: string;
  typ: "agent";
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
  v: unknown,
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
  token: string,
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

// -------------------- AGENT TOKENS --------------------

function getAgentSecret(): Secret {
  // keep separate secret for agents
  return requireEnv("AGENT_TOKEN_SECRET");
}

function getAgentExpiresIn(): SignOptions["expiresIn"] {
  return (process.env.AGENT_TOKEN_EXPIRES ?? "12h") as SignOptions["expiresIn"];
}

export function signAgentToken(
  payload: Omit<AgentTokenPayload, "typ">,
): string {
  const secret = getAgentSecret();
  const options: SignOptions = { expiresIn: getAgentExpiresIn() };
  return jwt.sign({ ...payload, typ: "agent" }, secret, options);
}

function isAgentTokenPayload(
  v: unknown,
): v is JwtStdPayload & AgentTokenPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as any;
  return (
    typeof o.sub === "string" &&
    typeof o.companyId === "string" &&
    o.typ === "agent"
  );
}

export function verifyAgentToken(
  token: string,
): JwtStdPayload & AgentTokenPayload {
  const secret = getAgentSecret();
  const decoded = jwt.verify(token, secret);

  if (typeof decoded === "string") throw new Error("Invalid token payload");
  if (!isAgentTokenPayload(decoded))
    throw new Error("Agent token payload missing required fields");

  return decoded;
}
