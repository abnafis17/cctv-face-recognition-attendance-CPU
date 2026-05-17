-- Add dynamic ERP attendance endpoint field (company-wise)
ALTER TABLE "CompanyRelaySetting"
ADD COLUMN IF NOT EXISTS "erpAttendanceEndpoint" TEXT;
