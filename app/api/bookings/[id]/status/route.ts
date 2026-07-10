import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await expireStaleBookings();

  const { status } = await req.json();
  if (
    ![
      "pending_payment",
      "approved",
      "rejected",
      "expired",
      "cancelled",
      "cancellation_requested",
    ].includes(status)
  ) {
    return NextResponse.json({ error: "وضعیت نامعتبر است" }, { status: 400 });
  }

  const { id } = await params;
  const booking = await prisma.booking.update({ where: { id }, data: { status } });
  return NextResponse.json(booking);
}
