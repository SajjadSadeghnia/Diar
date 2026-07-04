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
    <div className="min-h-[calc(100vh-180px)] lg:flex">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ink">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-display mb-2 text-3xl font-semibold text-ink">ورود به حساب کاربری</h1>
            <p className="text-charcoal-muted">ورود کارمندان و مدیر سامانه برای رزرو ویلای سازمانی</p>
          </div>

          {error && <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-muted">اطلاعات کاربر</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-muted/50" />
                <input
                  className="input pr-11 text-base"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-charcoal-muted">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-charcoal-muted/50" />
                <input
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-muted/50"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              className="btn-primary min-h-12 w-full py-3 text-base duration-200 hover:-translate-y-0.5 hover:brightness-110"
              disabled={loading}
            >
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>
        </div>
      </div>

      <div className="relative hidden lg:block lg:w-1/2">
        <Image src="/brand/login-umbrellas.jpg" alt="" fill className="object-cover" />
      </div>
    </div>
  );
}
