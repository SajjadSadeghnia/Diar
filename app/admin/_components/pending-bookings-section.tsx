import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeInfo } from "@/components/employee-info";
import { rejectPendingBookingForm } from "@/lib/admin-booking-actions";
import { toSecureReceiptUrl } from "@/lib/receipt-url";
import { formatRemainingMs, getBookingDisplayStatus, shouldShowPaymentCountdown } from "@/lib/booking-utils";
import { toJalaliDate, toToman } from "@/lib/utils";

interface PendingBooking {
  id: string;
  status: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  expiresAt: Date | null;
  user: { name: string; phone: string | null };
  payment: { receiptPath: string } | null;
}

interface PendingBookingsSectionProps {
  bookings: PendingBooking[];
  now: Date;
}

export function PendingBookingsSection({ bookings, now }: PendingBookingsSectionProps) {
  if (!bookings.length) return null;

  return (
    <section className="card">
      <h2 className="text-lg font-bold text-ink mb-2">رزروهای در انتظار پرداخت ({bookings.length})</h2>
      <p className="text-sm text-charcoal-muted mb-4">رزروهایی که هنوز تایید نشده‌اند — امکان رد بدون نیاز به رسید.</p>
      <div className="space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 space-y-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={getBookingDisplayStatus(b)} size="md" />
                </div>
                <EmployeeInfo name={b.user.name} phone={b.user.phone} />
                <p>
                  {toJalaliDate(b.startDate)} تا {toJalaliDate(b.endDate)} — {toToman(b.totalPrice)}
                </p>
                {shouldShowPaymentCountdown(b) && b.expiresAt && (
                  <p className="text-amber-800">مهلت پرداخت: {formatRemainingMs(b.expiresAt, now)}</p>
                )}
                {b.payment && (
                  <Link href={toSecureReceiptUrl(b.payment.receiptPath)} target="_blank" className="text-sm font-medium text-ink">
                    مشاهده رسید بارگذاری‌شده
                  </Link>
                )}
              </div>
              <form action={rejectPendingBookingForm}>
                <input type="hidden" name="bookingId" value={b.id} />
                <input type="hidden" name="redirectTo" value="/admin" />
                <button type="submit" className="btn-danger text-sm">
                  رد رزرو
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <Link href="/admin/bookings" className="mt-3 inline-block text-sm text-ink">
        مشاهده همه در صفحه رزروها
      </Link>
    </section>
  );
}
