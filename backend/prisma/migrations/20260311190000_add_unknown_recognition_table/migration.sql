-- Create table for unknown face recognition logs (company-wise)
CREATE TABLE "UnknownRecognition" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "confidence" DOUBLE PRECISION,
    "companyId" TEXT,
    "cameraId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnknownRecognition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UnknownRecognition_companyId_timestamp_idx"
ON "UnknownRecognition"("companyId", "timestamp");

CREATE INDEX "UnknownRecognition_cameraId_timestamp_idx"
ON "UnknownRecognition"("cameraId", "timestamp");

ALTER TABLE "UnknownRecognition"
ADD CONSTRAINT "UnknownRecognition_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UnknownRecognition"
ADD CONSTRAINT "UnknownRecognition_cameraId_fkey"
FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;