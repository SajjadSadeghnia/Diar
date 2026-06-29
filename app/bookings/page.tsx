import Link from "next/link";
import { BookingPaymentStatus } from "@/components/booking-payment-status";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import { getBookingDisplayStatus } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { getSingleProperty } from "@/lib/property";
import { toToman, toJalaliDate } from "@/lib/utils";
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
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-black">رزروهای من</h1>
        {user.role === "employee" && (
          <Link href={reserveHref} className="btn-primary min-h-11 text-sm">
            رزرو جدید
          </Link>
        )}
      </div>

      <div className="grid gap-4">
        {bookings.map((b) => (
          <div key={b.id} className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-[#1a365d]">{b.property.title}</h2>
              <StatusBadge status={getBookingDisplayStatus(b)} />
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
              <p>
                <span className="font-medium">تاریخ اقامت:</span> {toJalaliDate(b.startDate)} تا{" "}
                {toJalaliDate(b.endDate)}
              </p>
              <p>
                <span className="font-medium">مبلغ کل:</span> {toToman(b.totalPrice)}
              </p>
              {b.status === "approved" ? (
                <p className="font-medium text-emerald-700 md:col-span-2">
                  شماره تماس پشتیبانی: {b.property.contactPhone}
                </p>
              ) : b.status === "expired" ? (
                <p className="text-slate-500 md:col-span-2">مهلت پرداخت تمام شده — تاریخ آزاد است.</p>
              ) : b.status !== "pending_payment" ? (
                <p className="text-amber-700 md:col-span-2">شماره تماس پس از تایید رزرو نمایش داده می‌شود.</p>
              ) : null}
            </div>

            {b.payment && b.status !== "pending_payment" ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 text-sm">
                <p>فیش واریزی ثبت شده است.</p>
                <Link href={b.payment.receiptPath} target="_blank" className="font-semibold text-blue-700">
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
          <div className="card text-center text-slate-500">رزروی ثبت نشده است.</div>
        )}
      </div>
    </main>
  );
}
