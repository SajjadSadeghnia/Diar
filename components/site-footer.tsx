import Link from "next/link";
import { Building2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SiteFooterProps = {
  hasBottomNav?: boolean;
};

export async function SiteFooter({ hasBottomNav = false }: SiteFooterProps) {
  const user = await getCurrentUser();
  const setting = await prisma.systemSetting.findUnique({ where: { id: 1 } });
  const contactPhone = setting?.contactPhone || "021-12345678";
  const contactInfo = setting?.contactInfo || "مدیر سامانه دیار";

  return (
    <footer className={`mt-12 bg-ink text-white ${hasBottomNav ? "pb-24 md:pb-0" : ""}`}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">دیار</p>
              <p className="text-xs text-white/60">سامانه رزرو داخلی</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white/90">دسترسی سریع</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>
              <Link href={user?.role === "admin" ? "/admin" : "/"}>خانه</Link>
            </p>
            {!user && (
              <p>
                <Link href="/login">ورود</Link>
              </p>
            )}
            {user && (
              <p>
                <Link href={user.role === "admin" ? "/admin/bookings" : "/bookings"}>رزروها</Link>
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-semibold text-white/90">تماس با ما</h3>
          <div className="space-y-2 text-sm text-white/70">
            <p>{contactInfo}</p>
            <p>
              تلفن: <span dir="ltr">{contactPhone}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-sm text-white/60">
        © 1405 تمامی حقوق محفوظ است | دیار
      </div>
    </footer>
  );
}
