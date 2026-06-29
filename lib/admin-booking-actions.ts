"use server";

import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Reject a pending_payment booking (with or without uploaded receipt). */
export async function rejectPendingBooking(bookingId: string) {
  if (!bookingId) {
    return { ok: false as const, error: "شناسه رزرو نامعتبر است" };
  }

  try {
    await expireStaleBookings();

    await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
      });

      if (!booking) {
        throw new Error("رزرو یافت نشد");
      }

      if (booking.status !== "pending_payment") {
        throw new Error("فقط رزروهای در انتظار پرداخت قابل رد هستند");
      }

      if (isBookingExpired(booking)) {
        await tx.booking.update({ where: { id: bookingId }, data: { status: "expired" } });
        throw new Error("مهلت این رزرو به پایان رسیده است");
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "rejected" },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "rejected" },
        });
      }
    });

    revalidatePath("/admin");
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/payments");
    revalidatePath("/bookings");
    revalidatePath("/");

    return { ok: true as const, message: "رزرو با موفقیت رد شد" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطا در رد رزرو";
    return { ok: false as const, error: message };
  }
}

export async function rejectPendingBookingForm(formData: FormData) {
  const bookingId = String(formData.get("bookingId") || "");
  const redirectTo = String(formData.get("redirectTo") || "/admin/bookings");
  const result = await rejectPendingBooking(bookingId);

  const { redirect } = await import("next/navigation");

  if (!result.ok) {
    redirect(`${redirectTo}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`${redirectTo}?success=${encodeURIComponent(result.message ?? "انجام شد")}`);
}
