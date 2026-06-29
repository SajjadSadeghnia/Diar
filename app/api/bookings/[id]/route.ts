import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** GET single booking for payment continuation (owner or admin read). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { id } = await params;

  await expireStaleBookings();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, payment: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "رزرو یافت نشد" }, { status: 404 });
  }

  if (user.role === "employee" && booking.userId !== user.userId) {
    return NextResponse.json({ error: "دسترسی به این رزرو مجاز نیست" }, { status: 403 });
  }

  if (booking.status === "pending_payment" && isBookingExpired(booking)) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "expired" },
    });
    booking.status = "expired";
  }

  return NextResponse.json(booking);
}
