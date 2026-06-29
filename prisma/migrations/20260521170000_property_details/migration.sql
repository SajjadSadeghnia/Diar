-- AlterTable
ALTER TABLE "Property" ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Property" ADD COLUMN "bedrooms" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Property" ADD COLUMN "bathroomInfo" TEXT NOT NULL DEFAULT 'یک سرویس ایرانی';
ALTER TABLE "Property" ADD COLUMN "seaDistance" TEXT NOT NULL DEFAULT 'ورودی دریا از درب داخل شهرک';
ALTER TABLE "Property" ADD COLUMN "mapUrl" TEXT;
ALTER TABLE "Property" ADD COLUMN "mobileSignal" TEXT NOT NULL DEFAULT 'مناسب';
ALTER TABLE "Property" ADD COLUMN "detailsJson" JSONB;
