"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

type Props = {
  bookingId: string;
  status: string;
};

export function DeleteBookingButton({ bookingId, status }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (status !== "approved" && status !== "rejected") return null;

  async function confirmDelete() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoading(false);
      setError(data.error || "خطا در حذف رزرو");
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-danger inline-flex items-center gap-1.5 text-xs"
      >
        <Trash2 className="h-3.5 w-3.5" />
        حذف رزرو
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-canvas-raised p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-ink">حذف رزرو</h3>
            <p className="mt-2 text-sm text-charcoal-muted">
              این عملیات غیرقابل بازگشت است. رزرو و اطلاعات پرداخت آن برای همیشه حذف می‌شود.
            </p>
            {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setOpen(false)} disabled={loading}>
                انصراف
              </button>
              <button className="btn-danger" onClick={confirmDelete} disabled={loading}>
                {loading ? "در حال حذف..." : "بله، حذف کن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
