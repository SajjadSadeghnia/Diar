import Link from "next/link";
import { CalendarDays, House, Plus } from "lucide-react";
import { BookingPaymentStatus } from "@/components/booking-payment-status";
import { StatCard } from "@/components/stat-card";
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
    <div className="page-shell space-y-5">
      <header className="page-intro">
        <div>
          <h1 className="page-title">سلام، {user.name}</h1>
          <p className="page-description">رزروهای جاری و مسیر سریع ثبت اقامت بعدی‌تان را از اینجا پیگیری کنید.</p>
        </div>
        <Link className="btn-primary inline-flex items-center gap-2" href={reserveHref}>
          <Plus className="h-4 w-4" /> رزرو جدید
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="ویلای سازمانی"
          value={property?.title || "تنظیم نشده"}
          valueClassName="text-lg"
          icon={<House className="h-5 w-5" />}
          accent="ink"
        />
        <StatCard
          label="تعداد رزروهای من"
          value={bookingsCount}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="sea"
        />
        <StatCard label="در انتظار پرداخت" value={pendingBookings.length} accent="amber" />
      </section>

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

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">میان‌برها</h2>
          <Link className="btn-secondary min-h-11 text-sm" href={reserveHref}>
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
      </section>
    </div>
  );
}
