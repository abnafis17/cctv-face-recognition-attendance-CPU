-- Drop global unique cam_id constraint so camId can repeat across companies
DROP INDEX IF EXISTS "Camera_cam_id_key";

-- Enforce uniqueness per company when camId is provided
CREATE UNIQUE INDEX IF NOT EXISTS "Camera_companyId_cam_id_key"
ON "Camera"("companyId", "cam_id");
