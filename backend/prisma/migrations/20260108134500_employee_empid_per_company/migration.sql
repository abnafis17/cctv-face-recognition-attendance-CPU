-- Drop global unique emp_id constraint so empId can repeat across companies
DROP INDEX IF EXISTS "Employee_emp_id_key";

-- Unique per company when empId is provided
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_companyId_emp_id_key"
ON "Employee"("companyId", "emp_id");

-- Optional indexes to speed up lookups
CREATE INDEX IF NOT EXISTS "Employee_emp_id_idx" ON "Employee"("emp_id");
CREATE INDEX IF NOT EXISTS "Employee_companyId_idx" ON "Employee"("companyId");
