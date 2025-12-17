import { Router } from "express";

import healthRoutes from "./health.routes";
import employeesRoutes from "./employees.routes";
import galleryRoutes from "./gallery.routes";
import attendanceRoutes from "./attendance.routes";
import statsRoutes from "./stats.routes";
import camerasRoutes from "./cameras";

const router = Router();

router.use("/health", healthRoutes);
router.use("/api/employees", employeesRoutes);
router.use("/api/gallery", galleryRoutes);
router.use("/api/attendance", attendanceRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/cameras", camerasRoutes);

export default router;
