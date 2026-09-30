import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { BookingPaymentStatus } from "@/components/booking-payment-status";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { getBookingDisplayStatus } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { getSingleProperty } from "@/lib/property";
import { toToman, toJalaliDate } from "@/lib/utils";
import { toSecureReceiptUrl } from "@/lib/receipt-url";
import { redirect } from "next/navigation";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await expireStaleBookings();

  const property = await getSingleProperty();
  const reserveHref = property ? `/properties/${property.id}` : "/";
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: user.role === "employee" ? { userId: user.userId } : undefined,
    include: { property: true, payment: true, user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell animate-fade-in">
      <header className="page-intro">
        <div>
          <h1 className="page-title">رزروهای من</h1>
          <p className="page-description">وضعیت هر رزرو، زمان پرداخت و رسید ثبت‌شده را در یک نگاه ببینید.</p>
        </div>
        {user.role === "employee" && (
          <Link href={reserveHref} className="btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> رزرو جدید
          </Link>
        )}
      </header>

      <div className="grid gap-4">
        {bookings.map((b) => (
          <div key={b.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-semibold text-ink">{b.property.title}</h2>
              <StatusBadge status={getBookingDisplayStatus(b)} />
            </div>

            <div className="mt-3 grid gap-2 text-sm text-charcoal-muted md:grid-cols-2">
              <p>
                <span className="font-medium">تاریخ اقامت:</span> {toJalaliDate(b.startDate)} تا{" "}
                {toJalaliDate(b.endDate)}
              </p>
              <p>
                <span className="font-medium">مبلغ کل:</span> {toToman(b.totalPrice)}
              </p>
              {b.status === "approved" ? (
                <p className="font-medium text-emerald-700 md:col-span-2">
                  شماره تماس پشتیبانی: <span dir="ltr">{b.property.contactPhone}</span>
                </p>
              ) : b.status === "expired" ? (
                <p className="text-charcoal-muted md:col-span-2">مهلت پرداخت تمام شده — تاریخ آزاد است.</p>
              ) : b.status !== "pending_payment" ? (
                <p className="text-amber-700 md:col-span-2">شماره تماس پس از تایید رزرو نمایش داده می‌شود.</p>
              ) : null}
            </div>

            {b.payment && b.status !== "pending_payment" ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas p-3 text-sm">
                <p>فیش واریزی ثبت شده است.</p>
                <Link href={toSecureReceiptUrl(b.payment.receiptPath)} target="_blank" className="font-semibold text-ink">
                  مشاهده فیش
                </Link>
              </div>
            ) : null}

            {user.role === "employee" && (
              <BookingPaymentStatus
                bookingId={b.id}
                status={b.status}
                expiresAt={b.expiresAt}
                hasPayment={!!b.payment}
                receiptPath={b.payment?.receiptPath}
                now={now}
              />
            )}
          </div>
        ))}

        {!bookings.length && (
          <div className="empty-state">
            <span className="mb-3 rounded-2xl bg-ink-soft p-3 text-ink"><CalendarDays className="h-6 w-6" /></span>
            <p className="font-semibold text-ink">هنوز رزروی ثبت نشده است.</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-charcoal-muted">برای انتخاب تاریخ اقامت و شروع رزرو، وارد صفحه ویلا شوید.</p>
            {user.role === "employee" && <Link href={reserveHref} className="btn-primary mt-5">شروع رزرو</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
