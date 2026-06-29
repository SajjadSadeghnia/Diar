import { getCurrentUser } from "@/lib/auth";
import { createBookingHold, expireStaleBookings } from "@/lib/booking-lifecycle";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });

  await expireStaleBookings();

  const where = user.role === "admin" ? {} : { userId: user.userId };
  const bookings = await prisma.booking.findMany({
    where,
    include: { property: true, user: true, payment: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(bookings);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const propertyId = String(body.propertyId || "");
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    const booking = await createBookingHold({
      userId: user.userId,
      propertyId,
      startDate,
      endDate,
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Booking creation error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور در ایجاد رزرو" }, { status: 500 });
  }
}
