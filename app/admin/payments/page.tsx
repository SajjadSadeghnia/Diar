import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { getBookingDisplayStatus } from "@/lib/booking-utils";
import { toJalaliDate } from "@/lib/utils";
import { EmployeeInfo } from "@/components/employee-info";
import { requireAdminAction } from "@/lib/auth-session";
import { reviewPaymentForm } from "@/lib/admin-payment-actions";
import { toSecureReceiptUrl } from "@/lib/receipt-url";
import { prisma } from "@/lib/prisma";
import { toToman } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function AdminPaymentsPage() {
  const user = await requireAdminAction().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  const payments = await prisma.payment.findMany({
    include: { booking: { include: { user: true, property: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-shell space-y-6 animate-fade-in">
      <header className="page-intro">
        <div>
          <h1 className="page-title">مدیریت پرداخت‌ها</h1>
          <p className="page-description">بررسی و تایید رسیدهای بارگذاری‌شده</p>
        </div>
        <Link href="/admin" className="btn-secondary text-sm">
          بازگشت به داشبورد
        </Link>
      </header>

      <div className="grid gap-4">
        {payments.length === 0 && (
          <div className="empty-state">
            <p className="font-medium text-charcoal-muted">پرداختی ثبت نشده است.</p>
          </div>
        )}
        {payments.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-ink">{p.booking.property.title}</h2>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={p.status} />
                <StatusBadge status={getBookingDisplayStatus(p.booking)} />
              </div>
            </div>
            <EmployeeInfo name={p.booking.user.name} phone={p.booking.user.phone} className="mt-2" />
            <p className="mt-1 text-sm text-charcoal-muted">
              بازه رزرو: {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
            </p>
            <p className="mt-2 text-sm">
              مبلغ: <span dir="ltr">{toToman(p.amount)}</span>
            </p>
            <Image
              src={toSecureReceiptUrl(p.receiptPath)}
              alt="رسید"
              width={360}
              height={180}
              unoptimized
              className="mt-3 max-w-full rounded-lg border border-line"
            />
            {p.status === "pending" && (
              <form action={reviewPaymentForm} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={p.id} />
                <button className="btn-primary" name="paymentStatus" value="approved">
                  تایید پرداخت
                </button>
                <button className="btn-danger" name="paymentStatus" value="rejected">
                  رد پرداخت
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
