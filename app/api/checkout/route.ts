import { getCurrentUser } from "@/lib/auth";
import { createBookingHold } from "@/lib/booking-lifecycle";
import { saveFile } from "@/lib/upload";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Legacy one-step checkout: creates hold + payment in one request */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const formData = await req.formData();
  const propertyId = String(formData.get("propertyId") || "");
  const startDate = new Date(String(formData.get("startDate") || ""));
  const endDate = new Date(String(formData.get("endDate") || ""));
  const receipt = formData.get("receipt") as File;

  if (!propertyId || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "بازه تاریخ نامعتبر است" }, { status: 400 });
  }

  if (!receipt || receipt.size === 0) {
    return NextResponse.json({ error: "لطفا رسید پرداخت را بارگذاری کنید" }, { status: 400 });
  }

  try {
    const booking = await createBookingHold({
      userId: user.userId,
      propertyId,
      startDate,
      endDate,
    });

    const receiptPath = await saveFile(receipt, "receipts");

    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalPrice,
        receiptPath,
        status: "pending",
      },
    });

    return NextResponse.json({ booking, payment });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
