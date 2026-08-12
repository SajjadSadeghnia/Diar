import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { notifyPaymentReviewed } from "@/lib/booking-events";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";

export async function reviewPaymentById(input: {
  adminId: string;
  paymentId: string;
  paymentStatus: "approved" | "rejected";
  req?: Request;
}) {
  const { adminId, paymentId, paymentStatus, req } = input;

  await expireStaleBookings();

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: {
            user: true,
            property: true,
          },
        },
      },
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
      where: { id: paymentId },
      data: { status: paymentStatus },
    });

    const bookingStatus = paymentStatus === "approved" ? "approved" : "rejected";
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: bookingStatus },
    });

    await notifyPaymentReviewed({
      adminId,
      booking: payment.booking,
      approved: paymentStatus === "approved",
      req,
      tx,
    });

    return { payment, bookingStatus };
  });
}
