-- Add company-wise ERP integration fields
ALTER TABLE "CompanyRelaySetting"
ADD COLUMN IF NOT EXISTS "erpBaseUrl" TEXT,
ADD COLUMN IF NOT EXISTS "erpPrefix" TEXT;
