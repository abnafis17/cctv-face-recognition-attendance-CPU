ALTER TABLE "CompanyRelaySetting"
ADD COLUMN IF NOT EXISTS "urlType" TEXT;

UPDATE "CompanyRelaySetting"
SET "urlType" = 'door'
WHERE "urlType" IS NULL OR BTRIM("urlType") = '';

ALTER TABLE "CompanyRelaySetting"
ALTER COLUMN "urlType" SET DEFAULT 'door';

ALTER TABLE "CompanyRelaySetting"
ALTER COLUMN "urlType" SET NOT NULL;

DROP INDEX IF EXISTS "CompanyRelaySetting_companyId_key";
CREATE INDEX IF NOT EXISTS "CompanyRelaySetting_companyId_idx"
ON "CompanyRelaySetting"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyRelaySetting_companyId_urlType_key"
ON "CompanyRelaySetting"("companyId", "urlType");

ALTER TABLE "CompanyErpSetting"
ADD COLUMN IF NOT EXISTS "urlType" TEXT;

UPDATE "CompanyErpSetting"
SET "urlType" = 'attendance'
WHERE "urlType" IS NULL OR BTRIM("urlType") = '';

ALTER TABLE "CompanyErpSetting"
ALTER COLUMN "urlType" SET DEFAULT 'attendance';

ALTER TABLE "CompanyErpSetting"
ALTER COLUMN "urlType" SET NOT NULL;

DROP INDEX IF EXISTS "CompanyErpSetting_companyId_key";
CREATE INDEX IF NOT EXISTS "CompanyErpSetting_companyId_idx"
ON "CompanyErpSetting"("companyId");
CREATE UNIQUE INDEX IF NOT EXISTS "CompanyErpSetting_companyId_urlType_key"
ON "CompanyErpSetting"("companyId", "urlType");
