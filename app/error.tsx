"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">خطایی رخ داد</h1>
      <p className="mt-2 text-sm text-charcoal-muted">لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت با مدیر سامانه تماس بگیرید.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-secondary">
          تلاش مجدد
        </button>
        <Link href="/" className="btn-primary">
          بازگشت به خانه
        </Link>
      </div>
    </div>
  );
}
