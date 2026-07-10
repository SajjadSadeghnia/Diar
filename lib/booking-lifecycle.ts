import type { PrismaTransaction } from "@/lib/prisma-transaction";
import { prisma } from "@/lib/prisma";
import {
  enumerateNights,
  getPaymentExpiresAt,
  hasBookingOverlap,
  validateBookingDates,
  validateCooldown,
  type BookingRange,
} from "@/lib/booking-utils";

type Tx = PrismaTransaction;

/** Expire unpaid holds only — receipt upload lifts the 2h limit (admin review has no deadline). */
export async function expireStaleBookings(client: Tx | typeof prisma = prisma) {
  const now = new Date();
  const result = await client.booking.updateMany({
    where: {
      status: "pending_payment",
      expiresAt: { lt: now },
      payment: { is: null },
    },
    data: { status: "expired" },
  });
  return result.count;
}

export async function fetchBlockingBookings(propertyId: string, client: Tx | typeof prisma = prisma) {
  await expireStaleBookings(client);
  return client.booking.findMany({
    where: {
      propertyId,
      status: { in: ["approved", "pending_payment", "cancellation_requested"] },
    },
    select: {
      startDate: true,
      endDate: true,
      status: true,
      expiresAt: true,
      payment: { select: { id: true } },
    },
  });
}

export type CreateBookingInput = {
  userId: string;
  propertyId: string;
  startDate: Date;
  endDate: Date;
};

export async function createBookingHold(input: CreateBookingInput) {
  const { userId, propertyId, startDate, endDate } = input;
  const now = new Date();

  const dateValidation = validateBookingDates(startDate, endDate, now);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  return prisma.$transaction(async (tx) => {
    // Serialize concurrent booking creation for this property. Without this,
    // two simultaneous requests can both pass the overlap check below and
    // create overlapping holds (read-then-write race under READ COMMITTED).
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${propertyId}))`;

    await expireStaleBookings(tx);

    const property = await tx.property.findUnique({ where: { id: propertyId } });
    if (!property || property.status !== "available") {
      throw new Error("ملک قابل رزرو نیست");
    }

    const blocking = await tx.booking.findMany({
      where: {
        propertyId,
        status: { in: ["approved", "pending_payment", "cancellation_requested"] },
      },
      select: {
        startDate: true,
        endDate: true,
        status: true,
        expiresAt: true,
        payment: { select: { id: true } },
      },
    });

    const ranges: BookingRange[] = blocking.map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      expiresAt: b.expiresAt,
      hasPayment: Boolean(b.payment),
    }));

    if (hasBookingOverlap(startDate, endDate, ranges, now)) {
      throw new Error("این بازه در حال حاضر رزرو شده یا به‌صورت موقت رزرو است");
    }

    const lastApproved = await tx.booking.findFirst({
      where: { userId, status: "approved" },
      orderBy: { endDate: "desc" },
      select: { endDate: true },
    });

    const cooldownValidation = validateCooldown(startDate, lastApproved?.endDate ?? null, now);
    if (!cooldownValidation.valid) {
      throw new Error(cooldownValidation.error);
    }

    // Per-night pricing and admin-closed dates
    const nightStarts = enumerateNights(startDate, endDate);
    const overrides = await tx.dateOverride.findMany({
      where: { propertyId, date: { in: nightStarts } },
    });
    const overrideByNight = new Map(overrides.map((o) => [o.date.getTime(), o]));

    if (nightStarts.some((n) => overrideByNight.get(n.getTime())?.closed)) {
      throw new Error("بخشی از بازه انتخابی توسط مدیریت بسته شده است");
    }

    const totalPrice = nightStarts.reduce(
      (sum, n) => sum + (overrideByNight.get(n.getTime())?.price ?? property.dailyPrice),
      0
    );
    const expiresAt = getPaymentExpiresAt(now);

    const booking = await tx.booking.create({
      data: {
        userId,
        propertyId,
        startDate,
        endDate,
        totalPrice,
        status: "pending_payment",
        expiresAt,
      },
    });

    return booking;
  });
}
