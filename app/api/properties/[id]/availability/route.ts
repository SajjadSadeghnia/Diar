import { getCurrentUser } from "@/lib/auth";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import {
  getBlockedRanges,
  getEarliestCheckInDate,
  getPropertyAvailabilityState,
  toBookingRange,
  MAX_STAY_DAYS,
  PAYMENT_HOLD_HOURS,
} from "@/lib/booking-utils";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const now = new Date();

  try {
    const bookings = await fetchBlockingBookings(id);
    const ranges = bookings.map(toBookingRange);

    const blockedRanges = getBlockedRanges(ranges, now);
    const availability = getPropertyAvailabilityState(ranges, now);

    return NextResponse.json({
      propertyId: id,
      availability,
      blockedRanges: blockedRanges.map((r) => ({
        startDate: r.startDate.toISOString(),
        endDate: r.endDate.toISOString(),
        type: r.type,
      })),
      minCheckInDate: getEarliestCheckInDate(now).toISOString(),
      maxStayDays: MAX_STAY_DAYS,
      paymentHoldHours: PAYMENT_HOLD_HOURS,
      currentTime: now.toISOString(),
    });
  } catch (error) {
    console.error("Error checking property availability:", error);
    return NextResponse.json({ error: "خطا در بررسی موجودی ملک" }, { status: 500 });
  }
}
