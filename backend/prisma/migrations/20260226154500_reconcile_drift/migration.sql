-- Reconcile only camera column/index naming drift.
DROP INDEX IF EXISTS "public"."Camera_camId_idx";
DROP INDEX IF EXISTS "public"."Camera_companyId_camId_key";

ALTER TABLE "public"."Camera" DROP COLUMN IF EXISTS "camId";
ALTER TABLE "public"."Camera" ADD COLUMN IF NOT EXISTS "cam_id" TEXT;

CREATE INDEX IF NOT EXISTS "Camera_cam_id_idx" ON "public"."Camera"("cam_id" ASC);
CREATE UNIQUE INDEX IF NOT EXISTS "Camera_companyId_cam_id_key" ON "public"."Camera"("companyId" ASC, "cam_id" ASC);

