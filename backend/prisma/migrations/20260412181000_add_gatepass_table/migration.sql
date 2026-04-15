CREATE TABLE "GatepassTable" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "destination" TEXT,
    "outTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'out',
    "requestCameraId" TEXT,
    "returnCameraId" TEXT,
    "externalSubmitAckAt" TIMESTAMP(3),
    "externalSubmitPayload" JSONB,
    "externalReturnAckAt" TIMESTAMP(3),
    "externalReturnPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GatepassTable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GatepassTable_companyId_outTime_idx"
ON "GatepassTable"("companyId", "outTime");

CREATE INDEX "GatepassTable_companyId_status_outTime_idx"
ON "GatepassTable"("companyId", "status", "outTime");

CREATE INDEX "GatepassTable_companyId_leaveType_status_idx"
ON "GatepassTable"("companyId", "leaveType", "status");

CREATE INDEX "GatepassTable_companyId_employeeId_status_outTime_idx"
ON "GatepassTable"("companyId", "employeeId", "status", "outTime");

CREATE INDEX "GatepassTable_requestCameraId_idx"
ON "GatepassTable"("requestCameraId");

CREATE INDEX "GatepassTable_returnCameraId_idx"
ON "GatepassTable"("returnCameraId");

ALTER TABLE "GatepassTable"
ADD CONSTRAINT "GatepassTable_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GatepassTable"
ADD CONSTRAINT "GatepassTable_employeeId_fkey"
FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GatepassTable"
ADD CONSTRAINT "GatepassTable_requestCameraId_fkey"
FOREIGN KEY ("requestCameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "GatepassTable"
ADD CONSTRAINT "GatepassTable_returnCameraId_fkey"
FOREIGN KEY ("returnCameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
