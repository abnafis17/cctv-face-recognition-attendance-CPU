-- Update User -> Company FK to cascade deletes
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey";

ALTER TABLE "User"
ADD CONSTRAINT "User_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
