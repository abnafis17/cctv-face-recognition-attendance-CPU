-- Reconcile Employee naming/index drift without data loss.
-- Handles both states:
-- 1) older camelCase schema ("empId")
-- 2) current snake_case mapped schema ("emp_id")

-- Remove old camelCase indexes if present.
DROP INDEX IF EXISTS "public"."Employee_empId_idx";
DROP INDEX IF EXISTS "public"."Employee_companyId_empId_key";

-- Ensure target columns exist.
ALTER TABLE "public"."Employee" ADD COLUMN IF NOT EXISTS "emp_id" TEXT;
ALTER TABLE "public"."Employee" ADD COLUMN IF NOT EXISTS "empPicUrl" TEXT;

-- Backfill emp_id from empId if old column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Employee'
      AND column_name = 'empId'
  ) THEN
    EXECUTE 'UPDATE "public"."Employee" SET "emp_id" = COALESCE("emp_id", "empId")';
  END IF;
END $$;

-- Drop old camelCase column if still present.
ALTER TABLE "public"."Employee" DROP COLUMN IF EXISTS "empId";

-- Recreate expected indexes for emp_id.
DROP INDEX IF EXISTS "public"."Employee_emp_id_idx";
DROP INDEX IF EXISTS "public"."Employee_companyId_emp_id_key";

CREATE INDEX IF NOT EXISTS "Employee_emp_id_idx"
ON "public"."Employee"("emp_id" ASC);

CREATE UNIQUE INDEX IF NOT EXISTS "Employee_companyId_emp_id_key"
ON "public"."Employee"("companyId" ASC, "emp_id" ASC);
