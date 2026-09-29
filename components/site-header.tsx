import Link from "next/link";
import { Building2, CalendarDays, CircleHelp, Home, LogIn, LogOut, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProfileDropdown } from "@/components/profile-dropdown";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <>
      <header className="sticky top-0 z-40 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:py-3.5">
          <Link href="/" className="flex items-center gap-2 rounded-xl transition-transform duration-200 hover:scale-[1.02] sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink shadow-[0_5px_14px_rgba(31,61,52,0.18)] md:h-11 md:w-11">
              <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <p className="text-base font-bold tracking-[-0.02em] text-ink md:text-xl">دیار</p>
              <p className="hidden text-xs text-charcoal-muted sm:block">سامانه رزرو ویلای سازمانی</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1.5 text-sm md:flex">
            <Link
              href={user?.role === "admin" ? "/admin" : user?.role === "employee" ? "/dashboard" : "/"}
              className="rounded-xl px-3.5 py-2 font-semibold text-charcoal-muted transition-colors duration-200 hover:bg-ink-soft hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" /> {user?.role === "admin" ? "داشبورد" : "خانه"}
              </span>
            </Link>

            {user ? (
              <>
                <Link
                  href="/help"
                  className="rounded-xl px-3.5 py-2 font-semibold text-charcoal-muted transition-colors duration-200 hover:bg-ink-soft hover:text-ink"
                >
                  راهنما
                </Link>
                <ProfileDropdown user={user} />
              </>
            ) : (
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 btn-hover">
                <LogIn className="h-4 w-4" /> ورود
              </Link>
            )}
          </nav>

          {/* Mobile Navigation - Top Bar */}
          <nav aria-label="ناوبری موبایل" className="relative z-10 flex items-center gap-2 md:hidden">
            {user ? (
              <>
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  aria-label={user.role === "admin" ? "داشبورد مدیریت" : "داشبورد من"}
                  className="btn-secondary min-h-11 min-w-11 rounded-xl p-2"
                >
                  <User className="h-4 w-4" />
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="btn-secondary min-h-11 min-w-11 rounded-xl p-2 text-charcoal-muted"
                    type="submit"
                    aria-label="خروج"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" aria-label="ورود" className="btn-primary min-h-11 min-w-11 rounded-xl p-2">
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      </header>

      {user && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-canvas-raised/95 shadow-[0_-6px_20px_rgba(42,36,32,0.06)] backdrop-blur-sm md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <nav aria-label="ناوبری پایین" className="flex justify-around">
              <Link
                href={user.role === "admin" ? "/admin" : "/"}
                className="flex min-w-16 flex-col items-center gap-1 rounded-xl p-2 text-charcoal-muted transition-colors duration-200 hover:bg-ink-soft hover:text-ink"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">{user.role === "admin" ? "داشبورد" : "خانه"}</span>
              </Link>
              <Link
                href={user.role === "admin" ? "/admin/bookings" : "/bookings"}
                className="flex min-w-16 flex-col items-center gap-1 rounded-xl p-2 text-charcoal-muted transition-colors duration-200 hover:bg-ink-soft hover:text-ink"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-xs">رزروها</span>
              </Link>
              <Link
                href={user.role === "admin" ? "/admin/properties" : "/help"}
                className="flex min-w-16 flex-col items-center gap-1 rounded-xl p-2 text-charcoal-muted transition-colors duration-200 hover:bg-ink-soft hover:text-ink"
              >
                {user.role === "admin" ? <Building2 className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}
                <span className="text-xs">{user.role === "admin" ? "ویلا" : "راهنما"}</span>
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
