-- Phone-based login: remove email, require unique phone

UPDATE "User" SET "phone" = '09000000000' WHERE "phone" IS NULL OR TRIM("phone") = '';

-- Keep oldest account per phone; assign unique phone from id for duplicates (dev/test data safety)
WITH ranked AS (
  SELECT "id", "phone",
    ROW_NUMBER() OVER (PARTITION BY "phone" ORDER BY "createdAt" ASC) AS rn
  FROM "User"
)
UPDATE "User" AS u
SET "phone" = '09' || RIGHT(REPLACE(u."id", '-', ''), 9)
FROM ranked r
WHERE u."id" = r."id" AND r.rn > 1;

DROP INDEX IF EXISTS "User_email_key";

ALTER TABLE "User" DROP COLUMN IF EXISTS "email";

ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phone_key" ON "User"("phone");
