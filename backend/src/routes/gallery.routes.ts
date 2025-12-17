import { Router } from "express";
import {
  getTemplates,
  upsertTemplate,
} from "../controllers/gallery.controller";

const router = Router();

router.get("/templates", getTemplates);
router.post("/templates", upsertTemplate);

export default router;
