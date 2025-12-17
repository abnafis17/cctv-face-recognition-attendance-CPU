import { Router } from "express";
import axios from "axios";

const r = Router();
const AI = (process.env.AI_BASE_URL || "http://127.0.0.1:8000").replace(
  /\/$/,
  ""
);

r.post("/start", async (_req, res) => {
  const ai = await axios.post(`${AI}/attendance/start`);
  res.json(ai.data);
});

r.post("/stop", async (_req, res) => {
  const ai = await axios.post(`${AI}/attendance/stop`);
  res.json(ai.data);
});

r.get("/status", async (_req, res) => {
  const ai = await axios.get(`${AI}/attendance/status`);
  res.json(ai.data);
});

export default r;
