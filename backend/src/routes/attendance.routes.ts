import { Router } from "express";
import {
  createAttendance,
  dataSync,
  listAttendance,
} from "../controllers/attendance.controller";

const router = Router();

router.post("/", createAttendance);
router.get("/", listAttendance);
router.get("/data-sync", dataSync);

export default router;
