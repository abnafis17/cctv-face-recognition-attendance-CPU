-- Create dedicated company-wise ERP settings table
CREATE TABLE "CompanyErpSetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "erpBaseUrl" TEXT,
    "erpPrefix" TEXT,
    "erpAttendanceEndpoint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyErpSetting_pkey" PRIMARY KEY ("id")
);

-- One ERP settings row per company
CREATE UNIQUE INDEX "CompanyErpSetting_companyId_key" ON "CompanyErpSetting"("companyId");

-- Link to company
ALTER TABLE "CompanyErpSetting"
ADD CONSTRAINT "CompanyErpSetting_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill ERP settings from previous relay table columns (if present).
INSERT INTO "CompanyErpSetting" (
    "id",
    "companyId",
    "erpBaseUrl",
    "erpPrefix",
    "erpAttendanceEndpoint",
    "createdAt",
    "updatedAt"
)
SELECT
    ('erp_' || crs."companyId"),
    crs."companyId",
    crs."erpBaseUrl",
    crs."erpPrefix",
    crs."erpAttendanceEndpoint",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "CompanyRelaySetting" crs
WHERE
    crs."erpBaseUrl" IS NOT NULL
    OR crs."erpPrefix" IS NOT NULL
    OR crs."erpAttendanceEndpoint" IS NOT NULL
ON CONFLICT ("companyId") DO UPDATE SET
    "erpBaseUrl" = EXCLUDED."erpBaseUrl",
    "erpPrefix" = EXCLUDED."erpPrefix",
    "erpAttendanceEndpoint" = EXCLUDED."erpAttendanceEndpoint",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Remove ERP columns from relay settings table (ERP now lives in dedicated table).
ALTER TABLE "CompanyRelaySetting"
DROP COLUMN IF EXISTS "erpBaseUrl",
DROP COLUMN IF EXISTS "erpPrefix",
DROP COLUMN IF EXISTS "erpAttendanceEndpoint";
