-- AlterTable
ALTER TABLE "Employee"
ADD COLUMN "section" TEXT,
ADD COLUMN "department" TEXT,
ADD COLUMN "line" TEXT;

-- CreateIndex
CREATE INDEX "Employee_companyId_section_idx" ON "Employee"("companyId", "section");

-- CreateIndex
CREATE INDEX "Employee_companyId_department_idx" ON "Employee"("companyId", "department");

-- CreateIndex
CREATE INDEX "Employee_companyId_line_idx" ON "Employee"("companyId", "line");

