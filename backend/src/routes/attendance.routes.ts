import { Router } from "express";
import {
  createAttendance,
  listAttendance,
} from "../controllers/attendance.controller";

const router = Router();

router.post("/", createAttendance);
router.get("/", listAttendance);

export default router;
