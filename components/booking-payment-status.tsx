import Link from "next/link";
import { formatRemainingMs, isBookingExpired } from "@/lib/booking-utils";

type BookingPaymentStatusProps = {
  bookingId: string;
  status: string;
  expiresAt: Date | null;
  hasPayment: boolean;
  receiptPath?: string | null;
  now?: Date;
};

export function BookingPaymentStatus({
  bookingId,
  status,
  expiresAt,
  hasPayment,
  receiptPath,
  now = new Date(),
}: BookingPaymentStatusProps) {
  if (status === "expired") {
    return (
      <div className="mt-3 rounded-lg border border-line bg-canvas p-3 text-sm">
        <p className="font-medium text-charcoal-muted">مهلت پرداخت تمام شده است</p>
        <p className="mt-1 text-charcoal-muted/70">تاریخ‌های این رزرو آزاد شده‌اند. می‌توانید دوباره رزرو کنید.</p>
      </div>
    );
  }

  if (status === "pending_payment" && hasPayment) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <p className="font-medium">فیش شما ثبت شده و در انتظار بررسی است</p>
        {receiptPath ? (
          <Link href={receiptPath} target="_blank" className="mt-2 inline-block font-semibold text-ink">
            مشاهده فیش
          </Link>
        ) : null}
      </div>
    );
  }

  if (status === "pending_payment" && expiresAt && !isBookingExpired({ status, expiresAt, hasPayment }, now)) {
    return (
      <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <p className="text-sm font-medium text-amber-900">در انتظار پرداخت</p>
        <p className="text-sm text-amber-800">
          <span className="font-medium">زمان باقی‌مانده:</span> {formatRemainingMs(expiresAt, now)}
        </p>
        <Link
          href={`/payment/${bookingId}`}
          className="btn-primary inline-flex min-h-12 w-full items-center justify-center text-base duration-200 hover:-translate-y-0.5 hover:brightness-110 sm:w-auto"
        >
          ادامه پرداخت و آپلود فیش
        </Link>
      </div>
    );
  }

  if (status === "pending_payment") {
    return (
      <div className="mt-3 rounded-lg border border-line bg-canvas p-3 text-sm">
        <p className="font-medium text-charcoal-muted">مهلت پرداخت تمام شده است</p>
      </div>
    );
  }

  return null;
}
