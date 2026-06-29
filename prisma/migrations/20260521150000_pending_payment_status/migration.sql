-- Rename booking state: pending -> pending_payment (گنجه lifecycle)
ALTER TYPE "BookingStatus" RENAME VALUE 'pending' TO 'pending_payment';
