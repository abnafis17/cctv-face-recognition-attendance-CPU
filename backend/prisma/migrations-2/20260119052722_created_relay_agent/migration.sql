/*
  Warnings:

  - You are about to drop the column `cam_id` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `emp_id` on the `Employee` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,camId]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,empId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Camera_cam_id_idx";

-- DropIndex
DROP INDEX "Camera_companyId_cam_id_key";

-- DropIndex
DROP INDEX "Employee_companyId_emp_id_key";

-- DropIndex
DROP INDEX "Employee_emp_id_idx";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "cam_id",
ADD COLUMN     "camId" TEXT,
ADD COLUMN     "jpegQuality" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "relayAgentId" TEXT,
ADD COLUMN     "rtspUrlEnc" TEXT,
ADD COLUMN     "sendFps" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "sendHeight" INTEGER NOT NULL DEFAULT 360,
ADD COLUMN     "sendWidth" INTEGER NOT NULL DEFAULT 640,
ALTER COLUMN "rtspUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "emp_id",
ADD COLUMN     "empId" TEXT;

-- CreateTable
CREATE TABLE "RelayAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "publicKeyPem" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelayAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairCode" (
    "code" TEXT NOT NULL,
    "companyId" TEXT,
    "agentName" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "RelayAgent_companyId_idx" ON "RelayAgent"("companyId");

-- CreateIndex
CREATE INDEX "RelayAgent_lastSeenAt_idx" ON "RelayAgent"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelayAgent_companyId_name_key" ON "RelayAgent"("companyId", "name");

-- CreateIndex
CREATE INDEX "PairCode_companyId_idx" ON "PairCode"("companyId");

-- CreateIndex
CREATE INDEX "PairCode_expiresAt_idx" ON "PairCode"("expiresAt");

-- CreateIndex
CREATE INDEX "PairCode_agentId_idx" ON "PairCode"("agentId");

-- CreateIndex
CREATE INDEX "Camera_camId_idx" ON "Camera"("camId");

-- CreateIndex
CREATE INDEX "Camera_relayAgentId_idx" ON "Camera"("relayAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Camera_companyId_camId_key" ON "Camera"("companyId", "camId");

-- CreateIndex
CREATE INDEX "Employee_empId_idx" ON "Employee"("empId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_companyId_empId_key" ON "Employee"("companyId", "empId");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_relayAgentId_fkey" FOREIGN KEY ("relayAgentId") REFERENCES "RelayAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelayAgent" ADD CONSTRAINT "RelayAgent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairCode" ADD CONSTRAINT "PairCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairCode" ADD CONSTRAINT "PairCode_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RelayAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
