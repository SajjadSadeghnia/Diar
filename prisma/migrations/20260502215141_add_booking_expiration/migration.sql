-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'expired';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiresAt" TIMESTAMP(3);
