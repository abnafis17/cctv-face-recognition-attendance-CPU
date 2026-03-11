/*
  Warnings:

  - You are about to drop the column `cam_id` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `jpeg_quality` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `relay_agent_id` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `rtsp_url_enc` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `send_fps` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `send_height` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `send_width` on the `Camera` table. All the data in the column will be lost.
  - You are about to drop the column `emp_id` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `agent_name` on the `PairCode` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `PairCode` table. All the data in the column will be lost.
  - You are about to drop the column `last_seen_at` on the `RelayAgent` table. All the data in the column will be lost.
  - You are about to drop the column `public_key_pem` on the `RelayAgent` table. All the data in the column will be lost.
  - You are about to drop the column `refresh_token_hash` on the `RelayAgent` table. All the data in the column will be lost.
  - You are about to drop the column `DB_Source` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyId,camId]` on the table `Camera` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyId,empId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `agentName` to the `PairCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `PairCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicKeyPem` to the `RelayAgent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `refreshTokenHash` to the `RelayAgent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_relay_agent_id_fkey";

-- DropIndex
DROP INDEX "Camera_cam_id_idx";

-- DropIndex
DROP INDEX "Camera_companyId_cam_id_key";

-- DropIndex
DROP INDEX "Camera_relay_agent_id_idx";

-- DropIndex
DROP INDEX "Employee_companyId_emp_id_key";

-- DropIndex
DROP INDEX "Employee_emp_id_idx";

-- DropIndex
DROP INDEX "PairCode_expires_at_idx";

-- DropIndex
DROP INDEX "RelayAgent_last_seen_at_idx";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "cam_id",
DROP COLUMN "jpeg_quality",
DROP COLUMN "relay_agent_id",
DROP COLUMN "rtsp_url_enc",
DROP COLUMN "send_fps",
DROP COLUMN "send_height",
DROP COLUMN "send_width",
ADD COLUMN     "camId" TEXT,
ADD COLUMN     "jpegQuality" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "relayAgentId" TEXT,
ADD COLUMN     "rtspUrlEnc" TEXT,
ADD COLUMN     "sendFps" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "sendHeight" INTEGER NOT NULL DEFAULT 360,
ADD COLUMN     "sendWidth" INTEGER NOT NULL DEFAULT 640,
ALTER COLUMN "rtspUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "organization_id" TEXT;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "emp_id",
ADD COLUMN     "empId" TEXT;

-- AlterTable
ALTER TABLE "PairCode" DROP COLUMN "agent_name",
DROP COLUMN "expires_at",
ADD COLUMN     "agentId" TEXT,
ADD COLUMN     "agentName" TEXT NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RelayAgent" DROP COLUMN "last_seen_at",
DROP COLUMN "public_key_pem",
DROP COLUMN "refresh_token_hash",
ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "publicKeyPem" TEXT NOT NULL,
ADD COLUMN     "refreshTokenHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "DB_Source";

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

-- CreateIndex
CREATE INDEX "PairCode_expiresAt_idx" ON "PairCode"("expiresAt");

-- CreateIndex
CREATE INDEX "PairCode_agentId_idx" ON "PairCode"("agentId");

-- CreateIndex
CREATE INDEX "RelayAgent_lastSeenAt_idx" ON "RelayAgent"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_relayAgentId_fkey" FOREIGN KEY ("relayAgentId") REFERENCES "RelayAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairCode" ADD CONSTRAINT "PairCode_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "RelayAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
