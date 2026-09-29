"use client";

import Image from "next/image";
import { useState } from "react";
import { Building2, Eye, EyeOff, Lock, Phone } from "lucide-react";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "خطا در ورود");
        return;
      }

      window.location.href = data.role === "admin" ? "/admin" : "/";
    } catch {
      setLoading(false);
      setError("خطا در ارتباط با سرور");
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-4.75rem)] lg:grid-cols-[minmax(0,0.94fr)_minmax(30rem,1.06fr)]">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink shadow-[0_10px_24px_rgba(31,61,52,0.2)]">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-ink">ورود به دیار</h1>
            <p className="mt-3 text-sm leading-7 text-charcoal-muted sm:text-base">برای مشاهده زمان‌های آزاد و مدیریت رزروها وارد حساب کاربری خود شوید.</p>
          </div>

          {error && (
            <div role="alert" className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="card space-y-5 p-5 sm:p-6">
            <div>
              <label htmlFor="login-phone" className="mb-2 block text-sm font-medium text-charcoal-muted">
                شماره همراه
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-muted/50" />
                <input
                  id="login-phone"
                  className="input pr-11 text-base"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  aria-describedby="login-phone-hint"
                  required
                />
              </div>
              <p id="login-phone-hint" className="mt-2 text-xs text-charcoal-muted/75">شماره همراه ثبت‌شده در سامانه را وارد کنید.</p>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-charcoal-muted">
                رمز عبور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-muted/50" />
                <input
                  id="login-password"
                  className="input pr-11 pl-10 text-base"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز عبور"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
                  className="absolute left-2 top-1/2 min-h-10 min-w-10 -translate-y-1/2 rounded-lg p-2 text-charcoal-muted/70 transition-colors hover:bg-ink-soft hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary min-h-12 w-full py-3 text-base"
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>
        </div>
      </div>

      <div className="relative hidden overflow-hidden lg:block">
        <Image src="/brand/login-villa-dusk.jpg" alt="نمایی از ویلای دیار در غروب" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <p className="max-w-md text-2xl font-semibold leading-relaxed xl:text-3xl">یک اقامت آرام، با رزروی روشن و ساده.</p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/80 xl:text-base">دیار، سامانه داخلی رزرو ویلای سازمانی برای همکاران شرکت است.</p>
        </div>
      </div>
    </div>
  );
}
