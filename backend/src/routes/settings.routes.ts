import { Router } from "express";
import {
  deleteRelaySettings,
  getRelaySettings,
  updateRelaySettings,
} from "../controllers/relaySettings.controller";

const router = Router();

router.get("/relay", getRelaySettings);
router.post("/relay", updateRelaySettings);
router.put("/relay", updateRelaySettings);
router.patch("/relay", updateRelaySettings);
router.delete("/relay", deleteRelaySettings);

export default router;
