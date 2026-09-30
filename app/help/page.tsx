import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { COOLDOWN_DAYS, MAX_STAY_DAYS, PAYMENT_HOLD_HOURS } from "@/lib/booking-utils";
import { redirect } from "next/navigation";

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="page-shell max-w-3xl space-y-8 animate-fade-in">
      <header>
        <h1 className="page-title">راهنمای رزرو دیار</h1>
        <p className="page-description">قوانین و مراحل رزرو ویلای سازمانی</p>
      </header>

      <section className="card space-y-4">
        <h2 className="font-display text-lg font-semibold text-ink">مراحل رزرو</h2>
        <ol className="list-decimal space-y-2 pr-5 text-sm leading-7 text-charcoal-muted">
          <li>وارد شوید و از صفحه خانه یا داشبورد، ویلا را انتخاب کنید.</li>
          <li>تاریخ ورود و خروج را از تقویم جلالی انتخاب کنید.</li>
          <li>رزرو موقت ثبت می‌شود — {PAYMENT_HOLD_HOURS} ساعت برای بارگذاری فیش فرصت دارید.</li>
          <li>مبلغ را واریز کنید و تصویر رسید (JPG/PNG/WEBP، حداکثر ۲ مگابایت) را بارگذاری کنید.</li>
          <li>پس از بررسی مدیر، نتیجه در صفحه «رزروهای من» نمایش داده می‌شود.</li>
        </ol>
      </section>

      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">قوانین مهم</h2>
        <ul className="space-y-2 text-sm leading-7 text-charcoal-muted">
          <li>حداکثر مدت اقامت: {MAX_STAY_DAYS} شب</li>
          <li>رزرو همان‌روز مجاز نیست — حداقل یک روز قبل از ورود (ساعت ۱۲ ظهر)</li>
          <li>ورود و خروج: ساعت ۱۲ ظهر</li>
          <li>پس از هر رزرو تاییدشده، {COOLDOWN_DAYS} روز تا رزرو بعدی فاصله لازم است</li>
          <li>پس از بارگذاری فیش، رزرو منقضی نمی‌شود — منتظر بررسی مدیر بمانید</li>
          <li>شماره تماس پشتیبانی ویلا فقط پس از تایید رزرو نمایش داده می‌شود</li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">راهنمای تقویم</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">قابل رزرو</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">رزرو موقت (۲ ساعته)</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">رزرو شده</span>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href={user.role === "admin" ? "/admin" : "/"} className="btn-secondary">
          بازگشت
        </Link>
        {user.role === "employee" && (
          <Link href="/bookings" className="btn-primary">
            رزروهای من
          </Link>
        )}
      </div>
    </div>
  );
}
