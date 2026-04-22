CREATE TABLE "CameraBoundingBox" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cameraId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "topLeftX" DOUBLE PRECISION NOT NULL,
    "topLeftY" DOUBLE PRECISION NOT NULL,
    "topRightX" DOUBLE PRECISION NOT NULL,
    "topRightY" DOUBLE PRECISION NOT NULL,
    "bottomLeftX" DOUBLE PRECISION NOT NULL,
    "bottomLeftY" DOUBLE PRECISION NOT NULL,
    "bottomRightX" DOUBLE PRECISION NOT NULL,
    "bottomRightY" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CameraBoundingBox_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CameraBoundingBoxEmployee" (
    "id" TEXT NOT NULL,
    "boundingBoxId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraBoundingBoxEmployee_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CameraBoundingBox_cameraId_idx"
ON "CameraBoundingBox"("cameraId");

CREATE INDEX "CameraBoundingBox_cameraId_sortOrder_idx"
ON "CameraBoundingBox"("cameraId", "sortOrder");

CREATE INDEX "CameraBoundingBoxEmployee_boundingBoxId_idx"
ON "CameraBoundingBoxEmployee"("boundingBoxId");

CREATE INDEX "CameraBoundingBoxEmployee_employeeId_idx"
ON "CameraBoundingBoxEmployee"("employeeId");

CREATE UNIQUE INDEX "CameraBoundingBoxEmployee_boundingBoxId_employeeId_key"
ON "CameraBoundingBoxEmployee"("boundingBoxId", "employeeId");

ALTER TABLE "CameraBoundingBox"
ADD CONSTRAINT "CameraBoundingBox_cameraId_fkey"
FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraBoundingBoxEmployee"
ADD CONSTRAINT "CameraBoundingBoxEmployee_boundingBoxId_fkey"
FOREIGN KEY ("boundingBoxId") REFERENCES "CameraBoundingBox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraBoundingBoxEmployee"
ADD CONSTRAINT "CameraBoundingBoxEmployee_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
