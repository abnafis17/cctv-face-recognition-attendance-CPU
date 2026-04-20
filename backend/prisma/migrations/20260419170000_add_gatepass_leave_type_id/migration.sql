ALTER TABLE "GatepassTable"
ADD COLUMN IF NOT EXISTS "leaveTypeId" TEXT;

CREATE INDEX IF NOT EXISTS "GatepassTable_companyId_leaveTypeId_status_idx"
ON "GatepassTable"("companyId", "leaveTypeId", "status");
