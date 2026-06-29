-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "address" TEXT NOT NULL DEFAULT 'تهران، خیابان ولیعصر';

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" INTEGER NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);
