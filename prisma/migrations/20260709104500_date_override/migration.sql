-- CreateTable
CREATE TABLE "DateOverride" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "price" INTEGER,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DateOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DateOverride_propertyId_date_key" ON "DateOverride"("propertyId", "date");

-- AddForeignKey
ALTER TABLE "DateOverride" ADD CONSTRAINT "DateOverride_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy peak dates (if any) using property peakPrice as nightly price
INSERT INTO "DateOverride" ("id", "propertyId", "date", "price", "closed", "createdAt")
SELECT
    pd."id",
    pd."propertyId",
    pd."date",
    p."peakPrice",
    false,
    pd."createdAt"
FROM "PeakDate" pd
JOIN "Property" p ON p."id" = pd."propertyId"
WHERE p."peakPrice" IS NOT NULL;

-- DropTable
DROP TABLE "PeakDate";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "peakPrice";
