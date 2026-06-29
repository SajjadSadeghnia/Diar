"use client";

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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a365d]">
              <Building2 className="h-8 w-8 text-[#c9a227]" />
            </div>
            <h1 className="mb-2 text-3xl font-bold text-[#1a365d]">ورود به حساب کاربری</h1>
            <p className="text-gray-600">ورود کارمندان و مدیر سامانه برای رزرو ویلای سازمانی</p>
          </div>

          {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">شماره تماس</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
              <label className="mb-2 block text-sm font-medium text-gray-700">رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button className="btn-primary min-h-12 w-full py-3 text-base" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود به حساب"}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2">
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1a365d] to-[#2d4a3e] p-12 text-center text-white">
          <div>
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#c9a227]/20">
              <Building2 className="h-12 w-12 text-[#c9a227]" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">به دیار خوش آمدید</h2>
            <p className="text-xl text-gray-200">
              پس از ورود می‌توانید تاریخ رزرو را انتخاب کنید، رسید پرداخت بارگذاری کنید و وضعیت رزرو را پیگیری کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
