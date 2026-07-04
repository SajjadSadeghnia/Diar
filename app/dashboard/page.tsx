import Link from "next/link";
import { BookingPaymentStatus } from "@/components/booking-payment-status";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { getBookingDisplayStatus, isBookingExpired } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { getSingleProperty } from "@/lib/property";
import { toToman, toJalaliDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "employee") redirect("/admin");

  await expireStaleBookings();

  const property = await getSingleProperty();
  const now = new Date();

  const [bookingsCount, pendingBookings, lastBooking] = await Promise.all([
    prisma.booking.count({ where: { userId: user.userId } }),
    prisma.booking.findMany({
      where: { userId: user.userId, status: "pending_payment" },
      include: { property: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findFirst({
      where: { userId: user.userId },
      include: { property: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const reserveHref = property ? `/properties/${property.id}` : "/";

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-charcoal-muted">ویلای سازمانی</p>
          <p className="mt-2 text-lg font-bold text-ink">{property?.title || "تنظیم نشده"}</p>
        </div>
        <div className="card">
          <p className="text-charcoal-muted">تعداد رزروهای من</p>
          <p className="mt-2 text-2xl font-bold text-ink">{bookingsCount}</p>
        </div>
        <div className="card">
          <p className="text-charcoal-muted">در انتظار پرداخت</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{pendingBookings.length}</p>
        </div>
      </div>

      {pendingBookings.length > 0 && (
        <section className="card">
          <h2 className="font-display text-lg font-semibold text-ink">رزروهای در جریان</h2>
          <p className="mt-1 text-sm text-charcoal-muted">
            اگر فیش بارگذاری نشده، مهلت ۲ ساعته برای آپلود دارید؛ پس از ثبت فیش، در انتظار بررسی ادمین می‌مانید.
          </p>
          <div className="mt-4 space-y-4">
            {pendingBookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold">{b.property.title}</p>
                  <StatusBadge status={getBookingDisplayStatus(b)} />
                </div>
                <p className="mt-2 text-sm text-charcoal-muted">
                  {toJalaliDate(b.startDate)} تا {toJalaliDate(b.endDate)} — {toToman(b.totalPrice)}
                </p>
                <BookingPaymentStatus
                  bookingId={b.id}
                  status={b.status}
                  expiresAt={b.expiresAt}
                  hasPayment={!!b.payment}
                  receiptPath={b.payment?.receiptPath}
                  now={now}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">میان‌برها</h2>
          <Link className="btn-primary min-h-11 text-sm duration-200 hover:-translate-y-0.5 hover:brightness-110" href={reserveHref}>
            رزرو جدید
          </Link>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/bookings" className="btn-secondary inline-flex min-h-11 items-center justify-center">
            مشاهده همه رزروها
          </Link>
          {lastBooking?.status === "pending_payment" &&
            !lastBooking.payment &&
            lastBooking.expiresAt &&
            !isBookingExpired(lastBooking, now) && (
            <Link
              href={`/payment/${lastBooking.id}`}
              className="btn-primary inline-flex min-h-11 items-center justify-center text-sm"
            >
              ادامه پرداخت و آپلود فیش
            </Link>
          )}
        </div>
        {lastBooking && (
          <p className="mt-3 text-sm text-charcoal-muted">
            آخرین رزرو: {lastBooking.property.title} — {toToman(lastBooking.totalPrice)}
          </p>
        )}
      </div>
    </main>
  );
}
