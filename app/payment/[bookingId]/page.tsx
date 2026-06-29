"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { formatRemainingMs } from "@/lib/booking-utils";
import { toJalaliDate, toToman } from "@/lib/utils";

type Setting = {
  cardNumber: string;
  instructions: string;
};

type PaymentInfo = {
  id: string;
  receiptPath: string;
  status: string;
};

type Booking = {
  id: string;
  status: string;
  totalPrice: number;
  expiresAt: string | null;
  startDate: string;
  endDate: string;
  property: { title: string };
  payment: PaymentInfo | null;
};

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [settingsError, setSettingsError] = useState("");
  const [remaining, setRemaining] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${bookingId}`, { credentials: "include", cache: "no-store" });
    const data = await res.json();

    if (res.status === 403) {
      setError("دسترسی به این رزرو مجاز نیست");
      setBooking(null);
      return;
    }

    if (!res.ok) {
      setError(data.error || "رزرو یافت نشد");
      setBooking(null);
      return;
    }

    setBooking(data);
    setAmount(String(data.totalPrice));
    setError("");
  }, [bookingId]);

  useEffect(() => {
    setPageLoading(true);
    Promise.all([
      fetch("/api/settings", { credentials: "include" }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا در دریافت تنظیمات پرداخت");
        setSetting(data);
      }),
      loadBooking(),
    ])
      .catch((e) => setError(e instanceof Error ? e.message : "خطا در بارگذاری"))
      .finally(() => setPageLoading(false));
  }, [loadBooking]);

  useEffect(() => {
    if (!booking?.expiresAt || booking.status !== "pending_payment" || booking.payment) return;

    const tick = () => {
      const ms = formatRemainingMs(new Date(booking.expiresAt!));
      setRemaining(ms);
      if (ms === "منقضی شده") {
        loadBooking();
      }
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [booking, loadBooking]);

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) {
      setError("رسید را آپلود کنید");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("مبلغ معتبر وارد کنید");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData();
    form.append("bookingId", bookingId);
    form.append("amount", amount);
    form.append("receipt", receipt);

    const res = await fetch("/api/payments", { method: "POST", credentials: "include", body: form });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "خطا در ثبت پرداخت");
      if (data.error?.includes("قبلاً ثبت شده")) {
        await loadBooking();
      }
      return;
    }

    setSuccess("فیش شما ثبت شده و در انتظار بررسی است");
    setTimeout(() => router.push("/bookings"), 900);
  }

  if (pageLoading) {
    return <div className="mx-auto mt-10 max-w-xl px-4">در حال بارگذاری...</div>;
  }

  const expired = booking?.status === "expired";
  const hasReceipt = !!booking?.payment;
  const holdActive =
    booking?.status === "pending_payment" &&
    !hasReceipt &&
    booking.expiresAt &&
    new Date(booking.expiresAt) > new Date();

  return (
    <div className="mx-auto mt-6 max-w-xl px-4 pb-6">
      <Link href="/bookings" className="mb-4 inline-flex text-sm text-blue-700">
        بازگشت به رزروها
      </Link>
      <div className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-black">پرداخت و بارگذاری فیش</h1>
          {booking && <StatusBadge status={booking.status} size="md" />}
        </div>

        {error && !booking && (
          <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
        )}

        {booking && (
          <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-3 text-sm">
            <p>
              <span className="font-medium">ویلا:</span> {booking.property.title}
            </p>
            <p>
              <span className="font-medium">تاریخ اقامت:</span> {toJalaliDate(booking.startDate)} تا{" "}
              {toJalaliDate(booking.endDate)}
            </p>
            <p>
              <span className="font-medium">مبلغ:</span> {toToman(booking.totalPrice)}
            </p>
            {holdActive && (
              <p className="font-medium text-amber-700">
                زمان باقی‌مانده: {remaining || formatRemainingMs(new Date(booking.expiresAt!))}
              </p>
            )}
          </div>
        )}

        {expired && (
          <div className="mb-4 space-y-3 rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
            <p className="font-medium">مهلت پرداخت این رزرو به پایان رسیده است</p>
            <p>تاریخ‌های انتخاب‌شده آزاد شده‌اند. می‌توانید رزرو جدید ثبت کنید.</p>
            <Link href="/bookings" className="btn-secondary inline-flex min-h-11 text-sm">
              بازگشت به رزروها
            </Link>
          </div>
        )}

        {hasReceipt && booking?.status === "pending_payment" && (
          <div className="mb-4 space-y-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
            <p className="font-medium">فیش پرداخت شما ثبت شده و در انتظار بررسی ادمین است</p>
            <div className="relative h-40 overflow-hidden rounded-lg border border-emerald-200">
              <Image src={booking.payment!.receiptPath} alt="فیش پرداخت" fill className="object-contain" />
            </div>
            <Link
              href={booking.payment!.receiptPath}
              target="_blank"
              className="inline-block font-semibold text-blue-700"
            >
              مشاهده فیش در اندازه بزرگ
            </Link>
            <Link href="/bookings" className="btn-secondary mt-2 inline-flex min-h-11 w-full justify-center text-sm">
              بازگشت به رزروها
            </Link>
          </div>
        )}

        {booking && !expired && !hasReceipt && booking.status !== "pending_payment" && (
          <p className="mb-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
            این رزرو دیگر در وضعیت «در انتظار پرداخت» نیست.
          </p>
        )}

        {settingsError && holdActive && (
          <p className="mb-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{settingsError}</p>
        )}

        {setting && holdActive && (
          <div className="mb-4 space-y-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
            <p>
              <span className="font-medium">شماره کارت:</span> {setting.cardNumber}
            </p>
            <p>{setting.instructions}</p>
          </div>
        )}

        {holdActive && (
          <form onSubmit={submitPayment} className="space-y-3">
            <input className="input" type="number" placeholder="مبلغ پرداختی" value={amount} readOnly />
            <input
              className="input min-h-12 file:mr-2 file:rounded-lg file:border-0 file:bg-[#1a365d] file:px-3 file:py-2 file:text-sm file:text-white"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setReceipt(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-slate-500">فرمت مجاز: JPG، PNG یا WEBP — حداکثر ۲ مگابایت</p>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            {success && <p className="text-sm text-emerald-600">{success}</p>}
            <button className="btn-primary min-h-12 w-full text-base" disabled={loading || !!settingsError}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="spinner" />
                  در حال ارسال...
                </span>
              ) : (
                "ارسال فیش"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
