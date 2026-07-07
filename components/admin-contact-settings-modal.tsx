"use client";

import { useState } from "react";

type Props = {
  initialContactPhone: string;
  initialContactInfo: string;
};

export function AdminContactSettingsModal({ initialContactPhone, initialContactInfo }: Props) {
  const [open, setOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState(initialContactPhone);
  const [contactInfo, setContactInfo] = useState(initialContactInfo);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ contactPhone, contactInfo }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "خطا در ذخیره تنظیمات");
      return;
    }

    setMessage("تنظیمات با موفقیت ذخیره شد");
    setTimeout(() => {
      setOpen(false);
      window.location.reload();
    }, 700);
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        تنظیمات تماس
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-canvas-raised p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">ویرایش اطلاعات تماس</h3>
              <button className="btn-secondary" onClick={() => setOpen(false)}>بستن</button>
            </div>

            <div className="space-y-3">
              <input
                className="input"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="شماره تلفن (مثلاً 021-12345678)"
                dir="ltr"
              />
              <input
                className="input"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="عنوان تماس (مثلاً مدیر سامانه دیار)"
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
              {message && <p className="text-sm text-emerald-600">{message}</p>}
            </div>

            <div className="mt-4">
              <button className="btn-primary" onClick={save} disabled={loading}>
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
