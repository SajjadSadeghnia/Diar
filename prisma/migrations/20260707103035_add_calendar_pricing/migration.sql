-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "peakPrice" INTEGER;

-- CreateTable
CREATE TABLE "PeakDate" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeakDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PeakDate_propertyId_date_key" ON "PeakDate"("propertyId", "date");

-- AddForeignKey
ALTER TABLE "PeakDate" ADD CONSTRAINT "PeakDate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
