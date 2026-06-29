"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toJalaliDate, toToman } from "@/lib/utils";

type Property = {
  id: string;
  title: string;
  dailyPrice: number;
};

type Setting = {
  cardNumber: string;
  instructions: string;
};

function CheckoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const propertyId = params.get("propertyId") || "";
  const startDate = params.get("startDate") || "";
  const endDate = params.get("endDate") || "";

  const [property, setProperty] = useState<Property | null>(null);
  const [setting, setSetting] = useState<Setting | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!propertyId) return;

    Promise.all([fetch(`/api/properties/${propertyId}`, { credentials: "include" }), fetch(`/api/settings`, { credentials: "include" })])
      .then(async ([p, s]) => {
        const propertyData = await p.json();
        const settingsData = await s.json();
        if (!p.ok) throw new Error(propertyData.error || "خطا در دریافت ملک");
        if (!s.ok) throw new Error(settingsData.error || "خطا در دریافت تنظیمات پرداخت");
        setProperty(propertyData);
        setSetting(settingsData);
      })
      .catch((e) => setError(e.message));
  }, [propertyId]);

  const totalPrice = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (!property || days <= 0) return 0;
    return days * property.dailyPrice;
  }, [startDate, endDate, property]);

  async function submitCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!receipt) {
      setError("لطفا رسید پرداخت را بارگذاری کنید");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData();
    form.append("propertyId", propertyId);
    form.append("startDate", startDate);
    form.append("endDate", endDate);
    form.append("receipt", receipt);

    const res = await fetch("/api/checkout", { method: "POST", credentials: "include", body: form });
    const data = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(data.error || "خطا در ثبت نهایی رزرو");
      return;
    }

    setSuccess("رزرو و پرداخت ثبت شد و در انتظار تایید ادمین است.");
    setTimeout(() => router.push("/bookings"), 900);
  }

  if (!property || !setting) return <div className="mx-auto max-w-6xl p-6">در حال بارگذاری اطلاعات چک‌اوت...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link href={`/properties/${propertyId}`} className="btn-secondary mb-4 inline-flex">بازگشت به ملک</Link>

      <div className="card">
        <h1 className="text-xl font-black">چک‌اوت و ارسال رسید</h1>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <p><span className="font-semibold">ملک:</span> {property.title}</p>
          <p><span className="font-semibold">بازه تاریخ:</span> {toJalaliDate(startDate)} تا {toJalaliDate(endDate)}</p>
          <p><span className="font-semibold">مبلغ کل:</span> {toToman(totalPrice)}</p>
        </div>

        <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
          <p><span className="font-semibold">شماره کارت پرداخت:</span> {setting.cardNumber}</p>
          <p className="mt-1">{setting.instructions}</p>
        </div>

        <form onSubmit={submitCheckout} className="mt-4 space-y-3">
          <input className="input" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? <span className="inline-flex items-center gap-2"><span className="spinner" />در حال ثبت...</span> : "ثبت نهایی رزرو"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl p-6">در حال بارگذاری اطلاعات چک‌اوت...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
