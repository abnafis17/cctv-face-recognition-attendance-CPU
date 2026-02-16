/*
  Warnings:

  - You are about to drop the column `jpegQuality` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `relayAgentId` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `rtspUrlEnc` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `sendFps` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `sendHeight` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `sendWidth` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the `PairCode` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RelayAgent` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `rtspUrl` on table `Camera` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_relayAgentId_fkey";

-- DropForeignKey
ALTER TABLE "PairCode" DROP CONSTRAINT "PairCode_agentId_fkey";

-- DropForeignKey
ALTER TABLE "PairCode" DROP CONSTRAINT "PairCode_companyId_fkey";

-- DropForeignKey
ALTER TABLE "RelayAgent" DROP CONSTRAINT "RelayAgent_companyId_fkey";

-- DropIndex
DROP INDEX "Camera_relayAgentId_idx";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "jpegQuality",
DROP COLUMN "relayAgentId",
DROP COLUMN "rtspUrlEnc",
DROP COLUMN "sendFps",
DROP COLUMN "sendHeight",
DROP COLUMN "sendWidth",
ALTER COLUMN "rtspUrl" SET NOT NULL;

-- DropTable
DROP TABLE "PairCode";

-- DropTable
DROP TABLE "RelayAgent";

-- CreateTable
CREATE TABLE "Headcount" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "companyId" TEXT,
    "cameraId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Headcount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Headcount_companyId_timestamp_idx" ON "Headcount"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "Headcount_cameraId_timestamp_idx" ON "Headcount"("cameraId", "timestamp");

-- CreateIndex
CREATE INDEX "Headcount_employeeId_timestamp_idx" ON "Headcount"("employeeId", "timestamp");

-- CreateIndex
CREATE INDEX "Headcount_companyId_status_timestamp_idx" ON "Headcount"("companyId", "status", "timestamp");

-- AddForeignKey
ALTER TABLE "Headcount" ADD CONSTRAINT "Headcount_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headcount" ADD CONSTRAINT "Headcount_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Headcount" ADD CONSTRAINT "Headcount_cameraId_fkey" FOREIGN KEY ("cameraId") REFERENCES "Camera"("id") ON DELETE SET NULL ON UPDATE CASCADE;
