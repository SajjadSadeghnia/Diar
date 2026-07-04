"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
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
    </main>
  );
}
