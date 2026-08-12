import { requireActiveUser, requireAdminUser } from "@/lib/auth-session";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** GET single booking for payment continuation (owner or admin read). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  await expireStaleBookings();

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, payment: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "رزرو یافت نشد" }, { status: 404 });
  }

  if (auth.user.role === "employee" && booking.userId !== auth.user.userId) {
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

/** Admin-only: permanently delete a booking after approved/rejected. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;

  const booking = await prisma.booking.findUnique({ where: { id } });

  if (!booking) {
    return NextResponse.json({ error: "رزرو یافت نشد" }, { status: 404 });
  }

  if (booking.status !== "approved" && booking.status !== "rejected") {
    return NextResponse.json({ error: "فقط رزروهای تایید یا رد شده قابل حذف هستند" }, { status: 400 });
  }

  await prisma.booking.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
