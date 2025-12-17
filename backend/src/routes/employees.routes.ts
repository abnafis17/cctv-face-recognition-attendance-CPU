import { Router } from "express";
import {
  getEmployees,
  upsertEmployee,
} from "../controllers/employees.controller";

const router = Router();

router.get("/", getEmployees);
router.post("/", upsertEmployee);

export default router;
