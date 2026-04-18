ALTER TABLE "UnknownRecognition"
ADD COLUMN "name" TEXT;

CREATE TABLE "CameraAuthorizedEmployee" (
    "cameraId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CameraAuthorizedEmployee_pkey" PRIMARY KEY ("cameraId", "employeeId")
);

CREATE INDEX "CameraAuthorizedEmployee_cameraId_idx"
ON "CameraAuthorizedEmployee"("cameraId");

CREATE INDEX "CameraAuthorizedEmployee_employeeId_idx"
ON "CameraAuthorizedEmployee"("employeeId");

ALTER TABLE "CameraAuthorizedEmployee"
ADD CONSTRAINT "CameraAuthorizedEmployee_cameraId_fkey"
FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CameraAuthorizedEmployee"
ADD CONSTRAINT "CameraAuthorizedEmployee_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
