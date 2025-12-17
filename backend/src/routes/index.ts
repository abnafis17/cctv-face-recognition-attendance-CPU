import { Router } from "express";

import healthRoutes from "./health.routes";
import employeesRoutes from "./employees.routes";
import galleryRoutes from "./gallery.routes";
import attendanceRoutes from "./attendance.routes";
import statsRoutes from "./stats.routes";
import cameras from "./cameras";
import attendanceControl from "./attendanceControl";
import enrollControl from "./enrollControl";
import enrollSession from "./enrollSession";
import cameraControl from "./cameras.control";

const router = Router();

router.use("/health", healthRoutes);
router.use("/api/employees", employeesRoutes);
router.use("/api/gallery", galleryRoutes);
router.use("/api/attendance", attendanceRoutes);
router.use("/api/stats", statsRoutes);
router.use("/api/cameras", cameras);

router.use("/api/attendance-control", attendanceControl);
router.use("/api/enroll", enrollControl);
router.use("/api/enroll-session", enrollSession);
router.use("/api/cameras", cameraControl);

export default router;
