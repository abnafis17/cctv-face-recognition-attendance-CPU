import { Router } from "express";
import {
  createUnknownRecognition,
  listUnknownRecognitions,
} from "../controllers/unknownRecognition.controller";

const router = Router();

router.post("/", createUnknownRecognition);
router.get("/", listUnknownRecognitions);

export default router;
