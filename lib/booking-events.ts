import type { PrismaTransaction } from "@/lib/prisma-transaction";
import { writeAuditLog } from "@/lib/audit-log";
import { createUserNotification } from "@/lib/notification-service";
import { sendAdminTelegram } from "@/lib/telegram-service";
import { toJalaliDate, toToman } from "@/lib/utils";

type BookingWithRelations = {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  user: { name: string; phone: string };
  property: { title: string };
};

export async function notifyBookingCreated(
  booking: BookingWithRelations,
  tx?: PrismaTransaction
): Promise<void> {
  await createUserNotification({
    tx,
    userId: booking.userId,
    type: "BOOKING_CREATED",
    title: "رزرو موقت ثبت شد",
    body: `رزرو ${booking.property.title} برای ${toJalaliDate(booking.startDate)} تا ${toJalaliDate(booking.endDate)} ثبت شد. تا ۲ ساعت برای بارگذاری فیش فرصت دارید.`,
    bookingId: booking.id,
    actionUrl: `/payment/${booking.id}`,
    dedupeKey: `booking-created:${booking.id}`,
  });
}

export async function notifyReceiptUploaded(
  booking: BookingWithRelations,
  tx?: PrismaTransaction
): Promise<void> {
  await createUserNotification({
    tx,
    userId: booking.userId,
    type: "RECEIPT_UPLOADED",
    title: "فیش شما ثبت شد",
    body: "فیش پرداخت دریافت شد و در انتظار بررسی مدیر است.",
    bookingId: booking.id,
    actionUrl: "/bookings",
    dedupeKey: `receipt-uploaded:${booking.id}`,
  });

  await createUserNotification({
    tx,
    userId: booking.userId,
    type: "AWAITING_ADMIN_REVIEW",
    title: "در انتظار تایید مدیر",
    body: "پس از بررسی، نتیجه رزرو از همین صفحه قابل مشاهده است.",
    bookingId: booking.id,
    actionUrl: "/bookings",
    dedupeKey: `awaiting-review:${booking.id}`,
  });

  await sendAdminTelegram(
    [
      "<b>فیش جدید دیار</b>",
      `کارمند: ${booking.user.name} (${booking.user.phone})`,
      `ویلا: ${booking.property.title}`,
      `بازه: ${toJalaliDate(booking.startDate)} تا ${toJalaliDate(booking.endDate)}`,
      `مبلغ: ${toToman(booking.totalPrice)}`,
      `شناسه رزرو: ${booking.id}`,
    ].join("\n")
  );
}

export async function notifyPaymentReviewed(input: {
  adminId: string;
  booking: BookingWithRelations;
  approved: boolean;
  req?: Request;
  tx?: PrismaTransaction;
}): Promise<void> {
  const { adminId, booking, approved, req, tx } = input;

  await createUserNotification({
    tx,
    userId: booking.userId,
    type: approved ? "BOOKING_APPROVED" : "BOOKING_REJECTED",
    title: approved ? "رزرو شما تایید شد" : "رزرو شما رد شد",
    body: approved
      ? `رزرو ${booking.property.title} تایید شد. شماره تماس پشتیبانی در صفحه رزروها نمایش داده می‌شود.`
      : `رزرو ${booking.property.title} رد شد. می‌توانید تاریخ دیگری انتخاب کنید.`,
    bookingId: booking.id,
    actionUrl: "/bookings",
    dedupeKey: `${approved ? "approved" : "rejected"}:${booking.id}`,
  });

  await writeAuditLog({
    tx,
    adminId,
    action: approved ? "BOOKING_APPROVED" : "BOOKING_REJECTED",
    entityType: "BOOKING",
    entityId: booking.id,
    summary: approved
      ? `تایید رزرو ${booking.user.name} — ${toJalaliDate(booking.startDate)}`
      : `رد رزرو ${booking.user.name} — ${toJalaliDate(booking.startDate)}`,
    metadata: {
      employeePhone: booking.user.phone,
      propertyTitle: booking.property.title,
      totalPrice: booking.totalPrice,
    },
    req,
  });
}

export async function notifyBookingRejectedByAdmin(input: {
  adminId: string;
  booking: BookingWithRelations;
  req?: Request;
  tx?: PrismaTransaction;
}): Promise<void> {
  await notifyPaymentReviewed({
    adminId: input.adminId,
    booking: input.booking,
    approved: false,
    req: input.req,
    tx: input.tx,
  });
}
