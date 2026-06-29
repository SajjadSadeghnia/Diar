import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/upload";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await expireStaleBookings();

  const payments = await prisma.payment.findMany({
    include: { booking: { include: { property: true, user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "employee") {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 });
  }

  try {
    await expireStaleBookings();

    const formData = await req.formData();
    const bookingId = String(formData.get("bookingId") || "");
    const amount = Number(formData.get("amount") || 0);
    const receipt = formData.get("receipt") as File;

    if (!bookingId || !receipt || !amount) {
      return NextResponse.json({ error: "اطلاعات پرداخت ناقص است" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "مبلغ پرداخت باید مثبت باشد" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await expireStaleBookings(tx);

      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true },
      });

      if (!booking || booking.userId !== user.userId) {
        throw new Error("رزرو یافت نشد");
      }

      if (booking.status !== "pending_payment") {
        throw new Error("این رزرو دیگر در وضعیت انتظار پرداخت نیست");
      }

      if (isBookingExpired(booking)) {
        await tx.booking.update({ where: { id: bookingId }, data: { status: "expired" } });
        throw new Error("مهلت پرداخت این رزرو به پایان رسیده است");
      }

      if (booking.payment) {
        throw new Error("فیش پرداخت شما قبلاً ثبت شده و در انتظار بررسی ادمین است");
      }

      if (amount !== booking.totalPrice) {
        throw new Error(`مبلغ پرداخت (${amount}) با مبلغ رزرو (${booking.totalPrice}) مطابقت ندارد`);
      }

      const receiptPath = await saveFile(receipt, "receipts");

      const payment = await tx.payment.create({
        data: { bookingId, amount, receiptPath, status: "pending" },
      });

      return { payment, booking };
    });

    return NextResponse.json(result.payment);
  } catch (error) {
    console.error("Payment upload error:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "خطای سرور در آپلود رسید" }, { status: 500 });
  }
}
