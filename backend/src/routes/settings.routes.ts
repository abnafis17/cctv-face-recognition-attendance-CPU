import { Router } from "express";
import {
  deleteErpSettings,
  getErpSettings,
  updateErpSettings,
} from "../controllers/erpSettings.controller";
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

router.get("/erp", getErpSettings);
router.post("/erp", updateErpSettings);
router.put("/erp", updateErpSettings);
router.patch("/erp", updateErpSettings);
router.delete("/erp", deleteErpSettings);

export default router;
