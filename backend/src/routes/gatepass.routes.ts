import { Router } from "express";
import {
  createGatepassRecord,
  listGatepassRecords,
  markGatepassReturn,
} from "../controllers/gatepass.controller";

const router = Router();

router.get("/", listGatepassRecords);
router.post("/", createGatepassRecord);
router.post("/mark-return", markGatepassReturn);

export default router;
