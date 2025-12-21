-- AlterTable
ALTER TABLE "User"
  ALTER COLUMN "emailVerified" SET DEFAULT false,
  ALTER COLUMN "emailVerified" TYPE BOOLEAN
  USING (CASE WHEN "emailVerified" IS NULL THEN false ELSE true END);
