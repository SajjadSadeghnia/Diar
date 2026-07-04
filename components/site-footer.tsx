import Link from "next/link";
import { Building2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-12 bg-[#1a365d] text-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a227]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold">دیار</p>
              <p className="text-xs text-gray-300">سامانه رزرو داخلی</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-[#c9a227]">دسترسی سریع</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>
              <Link href="/">خانه</Link>
            </p>
            <p>
              <Link href="/login">ورود</Link>
            </p>
            <p>
              <Link href="/bookings">رزروهای من</Link>
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-[#c9a227]">تماس با ما</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <p>مدیر سامانه دیار</p>
            <p>تلفن: 021-12345678</p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/20 py-4 text-center text-sm text-gray-300">
        © 1405 تمامی حقوق محفوظ است | دیار
      </div>
    </footer>
  );
}
