CREATE TABLE "CameraBoundingBoxTracking" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "boundingBoxId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "outTime" TIMESTAMP(3) NOT NULL,
    "inTime" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'out',
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CameraBoundingBoxTracking_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CameraBoundingBoxTracking_companyId_outTime_idx"
ON "CameraBoundingBoxTracking"("companyId", "outTime");

CREATE INDEX "CameraBoundingBoxTracking_cameraId_outTime_idx"
ON "CameraBoundingBoxTracking"("cameraId", "outTime");

CREATE INDEX "CameraBoundingBoxTracking_boundingBoxId_outTime_idx"
ON "CameraBoundingBoxTracking"("boundingBoxId", "outTime");

CREATE INDEX "CameraBoundingBoxTracking_employeeId_outTime_idx"
ON "CameraBoundingBoxTracking"("employeeId", "outTime");

CREATE INDEX "CameraBoundingBoxTracking_companyId_cameraId_status_outTime_idx"
ON "CameraBoundingBoxTracking"("companyId", "cameraId", "status", "outTime");

ALTER TABLE "CameraBoundingBoxTracking"
ADD CONSTRAINT "CameraBoundingBoxTracking_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraBoundingBoxTracking"
ADD CONSTRAINT "CameraBoundingBoxTracking_cameraId_fkey"
FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraBoundingBoxTracking"
ADD CONSTRAINT "CameraBoundingBoxTracking_boundingBoxId_fkey"
FOREIGN KEY ("boundingBoxId") REFERENCES "CameraBoundingBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraBoundingBoxTracking"
ADD CONSTRAINT "CameraBoundingBoxTracking_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
