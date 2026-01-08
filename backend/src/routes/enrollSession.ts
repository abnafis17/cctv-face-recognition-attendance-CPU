import { Router } from "express";
import axios from "axios";

const r = Router();
const AI = (process.env.AI_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

r.post("/start", async (req, res) => {
  const companyId = String((req as any).companyId ?? "");
  const ai = await axios.post(`${AI}/enroll/session/start`, req.body, {
    headers: companyId ? { "x-company-id": companyId } : undefined,
  });
  res.json(ai.data);
});

r.post("/stop", async (_req, res) => {
  const companyId = String((_req as any).companyId ?? "");
  const ai = await axios.post(`${AI}/enroll/session/stop`, null, {
    headers: companyId ? { "x-company-id": companyId } : undefined,
  });
  res.json(ai.data);
});

r.get("/status", async (_req, res) => {
  const companyId = String((_req as any).companyId ?? "");
  const ai = await axios.get(`${AI}/enroll/session/status`, {
    headers: companyId ? { "x-company-id": companyId } : undefined,
  });
  res.json(ai.data);
});

export default r;
