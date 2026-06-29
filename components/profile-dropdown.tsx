"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDropdownProps {
  user: {
    name: string;
    role: string;
  };
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-secondary inline-flex items-center gap-2 btn-hover"
      >
        <User className="h-4 w-4" />
        {user.name}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="py-1">
            {user.role === "employee" && (
              <Link
                href="/bookings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                رزروهای من
              </Link>
            )}
            <Link
              href={user.role === "admin" ? "/admin" : "/dashboard"}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              {user.role === "admin" ? "داشبورد مدیریت" : "پروفایل"}
            </Link>
            <form 
              action="/api/auth/logout" 
              method="post"
              onSubmit={(e) => {
                e.preventDefault();
                setIsOpen(false);
                const formData = new FormData();
                fetch('/api/auth/logout', {
                  method: 'POST',
                  credentials: 'include',
                  body: formData,
                }).then(() => {
                  window.location.href = '/login';
                }).catch(() => {
                  window.location.href = '/login';
                });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-right"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
