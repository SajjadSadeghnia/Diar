-- Add optional employee phone for admin review (گنجه)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
