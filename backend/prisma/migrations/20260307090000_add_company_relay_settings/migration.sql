-- CreateTable
CREATE TABLE "CompanyRelaySetting" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "relayOnUrl" TEXT,
    "relaySilentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyRelaySetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyRelaySetting_companyId_key" ON "CompanyRelaySetting"("companyId");

-- AddForeignKey
ALTER TABLE "CompanyRelaySetting" ADD CONSTRAINT "CompanyRelaySetting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
