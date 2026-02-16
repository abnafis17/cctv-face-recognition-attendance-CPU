-- AlterTable
ALTER TABLE "Camera" ADD COLUMN     "jpeg_quality" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "relay_agent_id" TEXT,
ADD COLUMN     "rtsp_url_enc" TEXT,
ADD COLUMN     "send_fps" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "send_height" INTEGER NOT NULL DEFAULT 360,
ADD COLUMN     "send_width" INTEGER NOT NULL DEFAULT 640;

-- CreateTable
CREATE TABLE "RelayAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT,
    "public_key_pem" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RelayAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PairCode" (
    "code" TEXT NOT NULL,
    "companyId" TEXT,
    "agent_name" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PairCode_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE INDEX "RelayAgent_companyId_idx" ON "RelayAgent"("companyId");

-- CreateIndex
CREATE INDEX "RelayAgent_last_seen_at_idx" ON "RelayAgent"("last_seen_at");

-- CreateIndex
CREATE UNIQUE INDEX "RelayAgent_companyId_name_key" ON "RelayAgent"("companyId", "name");

-- CreateIndex
CREATE INDEX "PairCode_companyId_idx" ON "PairCode"("companyId");

-- CreateIndex
CREATE INDEX "PairCode_expires_at_idx" ON "PairCode"("expires_at");

-- CreateIndex
CREATE INDEX "Camera_relay_agent_id_idx" ON "Camera"("relay_agent_id");

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_relay_agent_id_fkey" FOREIGN KEY ("relay_agent_id") REFERENCES "RelayAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelayAgent" ADD CONSTRAINT "RelayAgent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PairCode" ADD CONSTRAINT "PairCode_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
