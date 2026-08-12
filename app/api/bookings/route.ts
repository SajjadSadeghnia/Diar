import { requireActiveUser } from "@/lib/auth-session";
import { notifyBookingCreated } from "@/lib/booking-events";
import { createBookingHold, expireStaleBookings } from "@/lib/booking-lifecycle";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  await expireStaleBookings();

  const where = auth.user.role === "admin" ? {} : { userId: auth.user.userId };
  const bookings = await prisma.booking.findMany({
    where,
    include: { property: true, user: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;
  if (auth.user.role !== "employee") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const propertyId = String(body.propertyId || "");
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    const booking = await createBookingHold({
      userId: auth.user.userId,
      propertyId,
      startDate,
      endDate,
    });

    const fullBooking = await prisma.booking.findUnique({
      where: { id: booking.id },
      include: { user: true, property: true },
    });

    if (fullBooking) {
      await notifyBookingCreated(fullBooking);
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking creation error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور در ایجاد رزرو" }, { status: 500 });
  }
}
