import Link from "next/link";
import { Building2, CalendarDays, Home, LogIn, LogOut, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { ProfileDropdown } from "@/components/profile-dropdown";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <>
      <header className="sticky top-0 z-40 glass shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105 sm:gap-3">
            <div className="flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-ink shadow-md">
              <Building2 className="h-5 w-5 md:h-7 md:w-7 text-white" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink md:text-xl">دیار</p>
              <p className="hidden text-xs text-charcoal-muted sm:block">سامانه رزرو داخلی</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-sm">
            <Link
              href={user?.role === "admin" ? "/admin" : "/"}
              className="rounded-lg px-4 py-2 font-medium text-charcoal-muted transition hover:bg-ink/10 hover:text-ink"
            >
              <span className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" /> {user?.role === "admin" ? "داشبورد" : "خانه"}
              </span>
            </Link>

            {user ? (
              <ProfileDropdown user={user} />
            ) : (
              <Link href="/login" className="btn-primary inline-flex items-center gap-2 btn-hover">
                <LogIn className="h-4 w-4" /> ورود
              </Link>
            )}
          </nav>

          {/* Mobile Navigation - Top Bar */}
          <nav className="relative z-10 flex md:hidden items-center gap-2">
            {user ? (
              <>
                <Link href={user.role === "admin" ? "/admin" : "/dashboard"} className="btn-secondary p-2 rounded-lg btn-hover">
                  <User className="h-4 w-4" />
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="btn-secondary min-h-11 min-w-11 rounded-lg p-2 text-charcoal-muted btn-hover"
                    type="submit"
                    aria-label="خروج"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="btn-primary p-2 rounded-lg btn-hover">
                <LogIn className="h-4 w-4" />
              </Link>
            )}
          </nav>
        </div>
      </header>

      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-line bg-canvas-raised/90 backdrop-blur-sm z-30">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <div className="flex justify-around">
              <Link
                href={user.role === "admin" ? "/admin" : "/"}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-charcoal-muted hover:text-ink transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="text-xs">{user.role === "admin" ? "داشبورد" : "خانه"}</span>
              </Link>
              <Link
                href={user.role === "admin" ? "/admin/bookings" : "/bookings"}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-charcoal-muted hover:text-ink transition-colors"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-xs">رزروها</span>
              </Link>
              <Link
                href={user.role === "admin" ? "/admin/properties" : "/dashboard"}
                className="flex flex-col items-center gap-1 p-2 rounded-lg text-charcoal-muted hover:text-ink transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">{user.role === "admin" ? "ویلا" : "پروفایل"}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
