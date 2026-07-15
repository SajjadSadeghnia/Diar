"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { DateObject } from "react-multi-date-picker";
import { toJalaliDate, toToman } from "@/lib/utils";

type Property = {
  id: string;
  title: string;
  description: string;
  address: string;
  contactPhone: string;
  dailyPrice: number;
  status: "available" | "unavailable";
  images: string[];
};

type DateOverride = {
  id: string;
  date: string;
  price: number | null;
  closed: boolean;
};

export default function AdminPropertiesPage() {
  const [property, setProperty] = useState<Property | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dailyPrice, setDailyPrice] = useState("");
  const [status, setStatus] = useState<"available" | "unavailable">("available");
  const [images, setImages] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);
  const [overridePrice, setOverridePrice] = useState("");
  const [overrideClosed, setOverrideClosed] = useState(false);
  const [overrideSaving, setOverrideSaving] = useState(false);
  const [overrideError, setOverrideError] = useState("");
  const [overrideSuccess, setOverrideSuccess] = useState("");

  const loadOverrides = useCallback(async (propertyId: string) => {
    const res = await fetch(`/api/properties/${propertyId}/date-overrides`, { credentials: "include" });
    if (res.ok) setOverrides(await res.json());
  }, []);

  const load = useCallback(async () => {
    const res = await fetch("/api/properties", { credentials: "include" });
    const data = await res.json();
    const single = Array.isArray(data) ? data[0] : null;
    setProperty(single || null);
    if (single) {
      setTitle(single.title);
      setDescription(single.description);
      setAddress(single.address);
      setContactPhone(single.contactPhone);
      setDailyPrice(String(single.dailyPrice));
      setStatus(single.status);
      await loadOverrides(single.id);
    }
  }, [loadOverrides]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!property || !overrideDate) {
      setOverrideError("ابتدا تاریخ را انتخاب کنید");
      return;
    }
    if (!overrideClosed && !overridePrice) {
      setOverrideError("قیمت وارد کنید یا گزینه بستن تاریخ را فعال کنید");
      return;
    }

    setOverrideSaving(true);
    setOverrideError("");
    setOverrideSuccess("");

    const res = await fetch(`/api/properties/${property.id}/date-overrides`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: overrideDate.toISOString(),
        price: overridePrice ? Number(overridePrice) : null,
        closed: overrideClosed,
      }),
    });
    const data = await res.json();
    setOverrideSaving(false);

    if (!res.ok) {
      setOverrideError(data.error || "خطا در ذخیره");
      return;
    }

    setOverrideSuccess("ذخیره شد");
    setOverrideDate(null);
    setOverridePrice("");
    setOverrideClosed(false);
    await loadOverrides(property.id);
  }

  async function deleteOverride(date: string) {
    if (!property) return;
    setOverrideError("");
    const res = await fetch(`/api/properties/${property.id}/date-overrides`, {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    });
    if (res.ok) await loadOverrides(property.id);
    else setOverrideError("خطا در حذف");
  }

  async function saveProperty(e: React.FormEvent) {
    e.preventDefault();
    if (!property) {
      setError("ملکی برای ویرایش وجود ندارد. ابتدا از طریق دیتابیس یا seed یک ملک ایجاد کنید.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("address", address);
    form.append("contactPhone", contactPhone);
    form.append("dailyPrice", dailyPrice);
    form.append("status", status);
    if (images) Array.from(images).forEach((file) => form.append("images", file));

    const res = await fetch(`/api/properties/${property.id}`, {
      method: "PUT",
      credentials: "include",
      body: form,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "خطا در ذخیره ملک");
      return;
    }

    setSuccess("ملک با موفقیت به‌روزرسانی شد.");
    setImages(null);
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link href="/admin" className="btn-secondary mb-2 inline-flex">
        بازگشت به داشبورد
      </Link>

      <div className="card">
        <h1 className="font-display mb-2 text-lg font-semibold text-ink">ویرایش ویلای سازمانی</h1>
        <p className="mb-4 text-sm text-charcoal-muted">
          سامانه دیار فقط یک ملک دارد. در این بخش می‌توانید اطلاعات همان ملک را ویرایش کنید.
        </p>

        {!property ? (
          <p className="text-amber-700">ملکی ثبت نشده است. برای محیط توسعه، دستور seed را اجرا کنید.</p>
        ) : (
          <>
            <div className="radius-photo relative mb-4 h-48 overflow-hidden border border-line">
              <Image
                src={property.images[0] || "/placeholder-property.svg"}
                alt={property.title}
                fill
                className="object-cover"
                sizes="768px"
              />
            </div>

            <form onSubmit={saveProperty} className="grid gap-3 md:grid-cols-2">
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان" required />
              <input
                className="input"
                value={dailyPrice}
                onChange={(e) => setDailyPrice(e.target.value)}
                placeholder="قیمت روزانه"
                type="number"
                required
              />
              <input className="input md:col-span-2" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="آدرس" required />
              <input
                className="input md:col-span-2"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="شماره تماس پشتیبانی"
                required
              />
              <textarea
                className="input md:col-span-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات"
                required
              />
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as "available" | "unavailable")}>
                <option value="available">موجود</option>
                <option value="unavailable">ناموجود</option>
              </select>
              <input className="input" type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} />
              {error && <p className="text-sm text-rose-600 md:col-span-2">{error}</p>}
              {success && <p className="text-sm text-emerald-600 md:col-span-2">{success}</p>}
              <button disabled={loading} className="btn-primary md:col-span-2">
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </form>
          </>
        )}
      </div>

      {property && (
        <div className="card">
          <h2 className="font-display mb-2 text-lg font-semibold text-ink">قیمت و وضعیت روزهای خاص</h2>
          <p className="mb-4 text-sm text-charcoal-muted">
            برای هر تاریخ می‌توانید قیمت اختصاصی تعیین کنید یا آن روز را برای رزرو ببندید.
          </p>

          <form onSubmit={saveOverride} className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-charcoal-muted/70">تاریخ</label>
              <div className="property-date-picker min-w-0 w-full">
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={overrideDate || ""}
                  onChange={(v: DateObject | null) => setOverrideDate(v?.toDate?.() ?? null)}
                  containerClassName="w-full"
                  inputClass="input w-full"
                  className="w-full"
                  format="YYYY/MM/DD"
                  portal
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-charcoal-muted/70">قیمت این تاریخ (تومان)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={overridePrice}
                onChange={(e) => setOverridePrice(e.target.value)}
                placeholder={`پیش‌فرض: ${dailyPrice || "قیمت روزانه"}`}
              />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={overrideClosed}
                onChange={(e) => setOverrideClosed(e.target.checked)}
              />
              بستن این تاریخ برای رزرو
            </label>
            {overrideError && <p className="text-sm text-rose-600 md:col-span-2">{overrideError}</p>}
            {overrideSuccess && <p className="text-sm text-emerald-600 md:col-span-2">{overrideSuccess}</p>}
            <button disabled={overrideSaving} className="btn-primary md:col-span-2">
              {overrideSaving ? "در حال ذخیره..." : "ذخیره تاریخ"}
            </button>
          </form>

          {overrides.length > 0 && (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-right">
                    <th className="py-2">تاریخ</th>
                    <th className="py-2">قیمت</th>
                    <th className="py-2">وضعیت</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {overrides.map((o) => (
                    <tr key={o.id} className="border-b border-line/60">
                      <td className="py-2">{toJalaliDate(o.date)}</td>
                      <td className="py-2">{o.price != null ? toToman(o.price) : "—"}</td>
                      <td className="py-2">
                        {o.closed ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">بسته</span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">باز</span>
                        )}
                      </td>
                      <td className="py-2 text-left">
                        <button
                          type="button"
                          className="text-xs text-rose-600 underline"
                          onClick={() => deleteOverride(o.date)}
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
