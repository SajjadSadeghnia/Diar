"use client";

import { useState } from "react";

type Props = {
  initialCardNumber: string;
  initialInstructions: string;
};

export function AdminPaymentSettingsModal({ initialCardNumber, initialInstructions }: Props) {
  const [open, setOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState(initialCardNumber);
  const [instructions, setInstructions] = useState(initialInstructions);
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
      body: JSON.stringify({ cardNumber, instructions }),
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
        تنظیمات پرداخت
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-line bg-canvas-raised p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">ویرایش تنظیمات پرداخت</h3>
              <button className="btn-secondary" onClick={() => setOpen(false)}>بستن</button>
            </div>

            <div className="space-y-3">
              <input className="input" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="شماره کارت" />
              <textarea className="input min-h-24" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="توضیحات پرداخت" />
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
