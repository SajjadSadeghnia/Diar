import Image from "next/image";
import Link from "next/link";
import { Building2, Calendar, Clock, CheckCircle, XCircle, Settings } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { expireStaleBookings } from "@/lib/booking-lifecycle";
import {
  formatRemainingMs,
  getBookingDisplayStatus,
  isBookingExpired,
  shouldShowPaymentCountdown,
} from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { getSingleProperty } from "@/lib/property";
import { toJalaliDate, toToman } from "@/lib/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { StatusBadge } from "@/components/status-badge";
import { EmployeeInfo } from "@/components/employee-info";
import { AdminPaymentSettingsModal } from "@/components/admin-payment-settings-modal";
import { AdminContactSettingsModal } from "@/components/admin-contact-settings-modal";
import { rejectPendingBookingForm } from "@/lib/admin-booking-actions";

async function reviewPayment(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const paymentStatus = String(formData.get("paymentStatus")) as "approved" | "rejected";

  try {
    await expireStaleBookings();

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id },
        include: { booking: true },
      });

      if (!payment) {
        throw new Error("پرداخت یافت نشد");
      }

      if (paymentStatus === "approved") {
        if (payment.booking.status !== "pending_payment") {
          throw new Error("فقط رزروهای در انتظار پرداخت قابل تایید هستند");
        }
        if (isBookingExpired({ ...payment.booking, payment })) {
          await tx.booking.update({ where: { id: payment.bookingId }, data: { status: "expired" } });
          throw new Error("مهلت رزرو منقضی شده است");
        }
      }

      await tx.payment.update({
        where: { id },
        data: { status: paymentStatus },
      });

      const bookingStatus = paymentStatus === "approved" ? "approved" : "rejected";
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: bookingStatus },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/bookings");
    revalidatePath("/");
  } catch (error) {
    console.error("Payment review error:", error);
    throw new Error("خطا در بررسی پرداخت");
  }
}

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");

  await expireStaleBookings();

  const now = new Date();
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

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">داشبورد مدیریت دیار</h1>
        <p className="text-charcoal-muted">مدیریت ویلا، رزروها و پرداخت‌های کارمندان</p>
      </div>

      <section className="grid gap-6 md:grid-cols-3">
        <div className="card group hover:border-ink/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal-muted mb-1">ویلای سازمانی</p>
              <p className="text-lg font-bold text-ink">{property?.title || "تنظیم نشده"}</p>
              <p className="text-xs text-charcoal-muted/70 mt-1">
                {property ? (
                  <Link href="/admin/properties" className="text-ink hover:underline">
                    ویرایش ملک
                  </Link>
                ) : (
                  "ابتدا ملک را در بخش ویرایش تنظیم کنید"
                )}
              </p>
            </div>
            <div className="rounded-lg bg-ink/10 p-3">
              <Building2 className="h-6 w-6 text-ink" />
            </div>
          </div>
        </div>

        <div className="card group hover:border-ink/15 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal-muted mb-1">تعداد رزروها</p>
              <p className="text-3xl font-bold text-ink">{bookingCount}</p>
              <p className="text-xs text-charcoal-muted/70 mt-1">رزرو ثبت شده</p>
            </div>
            <div className="rounded-lg bg-ink/10 p-3">
              <Calendar className="h-6 w-6 text-ink" />
            </div>
          </div>
        </div>

        <div className="card group hover:border-clay/25 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal-muted mb-1">پرداخت‌های در انتظار</p>
              <p className="text-3xl font-bold text-clay">{paymentCount}</p>
              <p className="text-xs text-charcoal-muted/70 mt-1">نیاز به بررسی</p>
            </div>
            <div className="rounded-lg bg-clay/10 p-3">
              <Clock className="h-6 w-6 text-clay" />
            </div>
          </div>
        </div>
      </section>

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

      <section className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Settings className="h-5 w-5 text-ink" />
            تنظیمات پرداخت
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">مدیریت کارت بانکی و دستورالعمل‌های پرداخت برای کارمندان</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-charcoal-muted/70">شماره کارت فعلی:</p>
            <p className="font-medium text-ink">{setting?.cardNumber || "تنظیم نشده"}</p>
          </div>
          <AdminPaymentSettingsModal
            initialCardNumber={setting?.cardNumber || ""}
            initialInstructions={setting?.instructions || ""}
          />
        </div>
      </section>

      <section className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Settings className="h-5 w-5 text-ink" />
            اطلاعات تماس
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">شماره تماس و عنوان بخش «تماس با ما» در فوتر سایت</p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-charcoal-muted/70">شماره تماس فعلی:</p>
            <p className="font-medium text-ink" dir="ltr">{setting?.contactPhone || "تنظیم نشده"}</p>
          </div>
          <AdminContactSettingsModal
            initialContactPhone={setting?.contactPhone || ""}
            initialContactInfo={setting?.contactInfo || ""}
          />
        </div>
      </section>

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

      {pendingPaymentBookings.length > 0 && (
        <section className="card">
          <h2 className="text-lg font-bold text-ink mb-2">
            رزروهای در انتظار پرداخت ({pendingPaymentBookings.length})
          </h2>
          <p className="text-sm text-charcoal-muted mb-4">
            رزروهایی که هنوز تایید نشده‌اند — امکان رد بدون نیاز به رسید.
          </p>
          <div className="space-y-3">
            {pendingPaymentBookings.map((b) => (
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
                      <Link href={b.payment.receiptPath} target="_blank" className="text-sm font-medium text-ink">
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
      )}

      <section className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Clock className="h-5 w-5 text-ink" />
            رسیدها و تایید رزروهای در انتظار
          </h2>
          <p className="mt-2 text-sm text-charcoal-muted">اطلاعات رزرو، کارمند و رسید واریز را بررسی و تایید/رد کنید.</p>
        </div>

        <div className="space-y-6">
          {pendingPayments.map((p) => (
            <div key={p.id} className="card-hover rounded-xl border border-line/80 bg-canvas-raised p-6 transition-all duration-300 hover:shadow-lg hover:border-ink/15">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink">{p.booking.property.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <StatusBadge status="awaiting_admin_review" size="md" />
                    <span className="text-sm text-charcoal-muted">{toJalaliDate(p.createdAt)}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold text-ink">{toToman(p.amount)}</p>
                  <p className="text-xs text-charcoal-muted">مبلغ پرداخت</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <EmployeeInfo name={p.booking.user.name} phone={p.booking.user.phone} />
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium text-ink">ملک:</span> {p.booking.property.title}
                  </p>
                  <p>
                    <span className="font-medium text-ink">بازه رزرو:</span>{" "}
                    {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
                  </p>
                  <p>
                    <span className="font-medium text-ink">تماس پشتیبانی ملک:</span>{" "}
                    {p.booking.property.contactPhone}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-ink mb-2">رسید واریزی:</p>
                <div className="rounded-lg border border-line overflow-hidden">
                  <Image
                    src={p.receiptPath}
                    alt="رسید واریزی"
                    width={600}
                    height={200}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>

              <form action={reviewPayment} className="flex flex-wrap gap-3">
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  name="paymentStatus"
                  value="approved"
                  className="btn-primary flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  <CheckCircle className="h-4 w-4" />
                  تایید رزرو
                </button>
                <button
                  type="submit"
                  name="paymentStatus"
                  value="rejected"
                  className="btn-danger flex items-center gap-2 hover:shadow-lg transition-all duration-300"
                >
                  <XCircle className="h-4 w-4" />
                  رد رزرو
                </button>
              </form>
            </div>
          ))}

          {!pendingPayments.length && (
            <div className="card flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-canvas p-4 mb-4">
                <Clock className="h-8 w-8 text-charcoal-muted/50" />
              </div>
              <p className="text-charcoal-muted font-medium">در حال حاضر پرداخت در انتظار تایید وجود ندارد.</p>
              <p className="text-sm text-charcoal-muted/60 mt-2">همه پرداخت‌ها بررسی شده‌اند</p>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-bold text-ink">آرشیو کامل پرداخت‌ها و رزروها</h2>
        <p className="mt-1 text-sm text-charcoal-muted">در این بخش تمام سوابق قبلی (تایید/رد/درانتظار) همیشه قابل مشاهده است.</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-right">
                <th className="py-2">کارمند</th>
                <th className="py-2">ملک</th>
                <th className="py-2">بازه</th>
                <th className="py-2">مبلغ</th>
                <th className="py-2">وضعیت</th>
                <th className="py-2">فیش</th>
              </tr>
            </thead>
            <tbody>
              {allPayments.map((p) => (
                <tr key={p.id} className="border-b border-line/60">
                  <td className="py-3">
                    <p>{p.booking.user.name}</p>
                    <p className="text-xs text-charcoal-muted" dir="ltr">
                      {p.booking.user.phone || "—"}
                    </p>
                  </td>
                  <td>{p.booking.property.title}</td>
                  <td>
                    {toJalaliDate(p.booking.startDate)} تا {toJalaliDate(p.booking.endDate)}
                  </td>
                  <td>{toToman(p.amount)}</td>
                  <td className="space-y-1">
                    <StatusBadge status={p.booking.status} />
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <Link href={p.receiptPath} target="_blank" className="font-semibold text-ink">
                      مشاهده فیش
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
