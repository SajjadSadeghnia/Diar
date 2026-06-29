import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeInfo } from "@/components/employee-info";
import { getCurrentUser } from "@/lib/auth";
import { rejectPendingBookingForm } from "@/lib/admin-booking-actions";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { formatRemainingMs, getBookingDisplayStatus, shouldShowPaymentCountdown } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { toJalaliDate, toToman } from "@/lib/utils";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const params = await searchParams;
  await expireStaleBookings();
  const now = new Date();

  const [pendingBookings, allBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { status: "pending_payment" },
      include: { user: true, property: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      include: { user: true, property: true, payment: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black">مدیریت رزروها</h1>
          <p className="mt-1 text-sm text-slate-600">بررسی و رد رزروهای در انتظار پرداخت</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm">
          بازگشت به داشبورد
        </Link>
      </div>

      {params.success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {params.success}
        </div>
      )}
      {params.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {params.error}
        </div>
      )}

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-[#1a365d]">
          رزروهای در انتظار پرداخت ({pendingBookings.length})
        </h2>
        <p className="mb-4 text-sm text-slate-600">
          در این بخش می‌توانید رزروهایی را که هنوز رسید ندارند یا در انتظار بررسی هستند رد کنید.
        </p>

        <div className="space-y-4">
          {pendingBookings.map((b) => (
            <div key={b.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={getBookingDisplayStatus(b)} size="md" />
                  </div>
                  <EmployeeInfo name={b.user.name} phone={b.user.phone} />
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">بازه:</span> {toJalaliDate(b.startDate)} تا {toJalaliDate(b.endDate)}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-medium">مبلغ:</span> {toToman(b.totalPrice)}
                  </p>
                  {shouldShowPaymentCountdown(b) && b.expiresAt && (
                    <p className="text-sm font-medium text-amber-800">
                      مهلت پرداخت: {formatRemainingMs(b.expiresAt, now)}
                    </p>
                  )}
                  {b.payment && (
                    <Link href={b.payment.receiptPath} target="_blank" className="text-sm text-blue-700">
                      مشاهده رسید بارگذاری‌شده
                    </Link>
                  )}
                </div>
                <form action={rejectPendingBookingForm} className="shrink-0">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="redirectTo" value="/admin/bookings" />
                  <button type="submit" className="btn-danger">
                    رد رزرو
                  </button>
                </form>
              </div>
            </div>
          ))}
          {!pendingBookings.length && (
            <p className="text-center text-sm text-slate-500 py-8">رزرو در انتظار پرداخت وجود ندارد.</p>
          )}
        </div>
      </section>

      <section className="card overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-[#1a365d]">همه رزروها</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-right">
              <th className="py-2">کارمند</th>
              <th className="py-2">تماس</th>
              <th>ملک</th>
              <th>بازه</th>
              <th>وضعیت</th>
              <th>مهلت پرداخت</th>
            </tr>
          </thead>
          <tbody>
            {allBookings.map((b) => (
              <tr key={b.id} className="border-b border-slate-100">
                <td className="py-3">{b.user.name}</td>
                <td className="py-3" dir="ltr">
                  {b.user.phone || "—"}
                </td>
                <td>{b.property.title}</td>
                <td>
                  {toJalaliDate(b.startDate)} تا {toJalaliDate(b.endDate)}
                </td>
                <td>
                  <StatusBadge status={getBookingDisplayStatus(b)} />
                </td>
                <td className="text-amber-700">
                  {shouldShowPaymentCountdown(b) && b.expiresAt
                    ? formatRemainingMs(b.expiresAt, now)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
