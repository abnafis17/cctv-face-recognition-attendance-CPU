// src/middleware/agent.ts
import { Request, Response, NextFunction } from "express";
import { verifyAgentToken } from "../utils/jwt";

export function requireAgent(req: Request, res: Response, next: NextFunction) {
  const authHeader = String(req.headers["authorization"] ?? "");
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing agent token" });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return res.status(401).json({ error: "Missing agent token" });

  try {
    const payload = verifyAgentToken(token);
    (req as any).companyId = payload.companyId;
    (req as any).agentId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid agent token" });
  }
}
