import Link from "next/link";
import { Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSingleProperty } from "@/lib/property";
import { redirect } from "next/navigation";
import { AdminSettings } from "./_components/admin-settings";
import { AdminStats } from "./_components/admin-stats";
import { PaymentsHistoryTable } from "./_components/payments-history-table";
import { PendingBookingsSection } from "./_components/pending-bookings-section";
import { PendingPaymentsSection } from "./_components/pending-payments-section";
import { expireStaleBookings } from "@/lib/booking-lifecycle";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  await expireStaleBookings();

  const [property, bookingCount, paymentCount, setting, pendingPayments, allPayments, statusCounts, pendingPaymentBookings] =
    await Promise.all([
      getSingleProperty(),
      prisma.booking.count(),
      prisma.payment.count({
        where: { status: "pending", booking: { status: "pending_payment" } },
      }),
      prisma.systemSetting.findUnique({ where: { id: 1 } }),
      prisma.payment.findMany({
        where: { status: "pending", booking: { status: "pending_payment" } },
        include: { booking: { include: { property: true, user: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.payment.findMany({
        include: { booking: { include: { property: true, user: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.booking.findMany({
        where: { status: "pending_payment" },
        include: { user: true, property: true, payment: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

  const now = new Date();
  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <header className="page-intro">
        <div>
          <h1 className="page-title">داشبورد مدیریت دیار</h1>
          <p className="page-description">مدیریت ویلا، رزروها و پرداخت‌های کارمندان</p>
        </div>
      </header>

      <AdminStats property={property} bookingCount={bookingCount} paymentCount={paymentCount} />

      <section>
        <Link
          href="/admin/properties"
          className="card group flex items-start gap-4 transition-all duration-200 hover:border-ink/20 hover:shadow-md"
        >
          <div className="shrink-0 rounded-lg bg-ink/10 p-3">
            <Building2 className="h-6 w-6 text-ink" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">مدیریت ویلا و قیمت‌گذاری تاریخ‌ها</h2>
            <p className="mt-1 text-sm leading-relaxed text-charcoal-muted">
              ویرایش اطلاعات ویلا، قیمت روزانه و تعیین قیمت یا بستن روزهای خاص
            </p>
          </div>
        </Link>
      </section>

      <AdminSettings
        cardNumber={setting?.cardNumber || ""}
        instructions={setting?.instructions || ""}
        contactPhone={setting?.contactPhone || ""}
        contactInfo={setting?.contactInfo || ""}
      />

      <section className="card">
        <h2 className="text-lg font-bold text-ink mb-4">وضعیت رزروها</h2>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm">
            در انتظار پرداخت: <strong>{countByStatus.pending_payment ?? 0}</strong>
          </div>
          <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm">
            تایید شده: <strong>{countByStatus.approved ?? 0}</strong>
          </div>
          <div className="rounded-lg bg-rose-50 px-4 py-2 text-sm">
            رد شده: <strong>{countByStatus.rejected ?? 0}</strong>
          </div>
          <div className="rounded-lg bg-canvas px-4 py-2 text-sm">
            منقضی: <strong>{countByStatus.expired ?? 0}</strong>
          </div>
        </div>
        <Link href="/admin/bookings" className="mt-3 inline-block text-sm text-ink">
          مشاهده همه رزروها
        </Link>
      </section>

      <PendingBookingsSection bookings={pendingPaymentBookings} now={now} />
      <PendingPaymentsSection payments={pendingPayments} />
      <PaymentsHistoryTable payments={allPayments} />
    </div>
  );
}
