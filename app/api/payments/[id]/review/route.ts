import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await expireStaleBookings();

  const body = await req.json();
  const paymentStatus = body.paymentStatus ?? body.status;
  if (!["approved", "rejected"].includes(paymentStatus)) {
    return NextResponse.json({ error: "وضعیت پرداخت نامعتبر است" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: { booking: true },
      });

      if (!payment) {
        throw new Error("پرداخت یافت نشد");
      }

      if (paymentStatus === "approved") {
        if (payment.booking.status !== "pending_payment") {
          throw new Error("فقط رزروهای در انتظار پرداخت قابل تایید هستند");
        }
        if (isBookingExpired({ ...payment.booking, payment })) {
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "expired" },
          });
          throw new Error("مهلت رزرو منقضی شده است. تایید امکان‌پذیر نیست.");
        }
      }

      await tx.payment.update({
        where: { id },
        data: { status: paymentStatus },
      });

      const bookingStatus = paymentStatus === "approved" ? "approved" : "rejected";
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      });

      return { payment, bookingStatus };
    });

    return NextResponse.json({ message: "به روزرسانی شد", ...result });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
