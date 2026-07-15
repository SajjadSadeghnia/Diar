import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

/** Single Persian sans for body + headings (same family — IRANSans-style UI). */
const vazir = Vazirmatn({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "دیار | سامانه رزرو ویلای سازمانی",
  description: "سامانه داخلی رزرو ویلای سازمانی دیار",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const bottomNavPad = user ? "pb-24 md:pb-0" : "";

  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className={`${vazir.className} min-h-screen`}>
        <SiteHeader />
        <main className={bottomNavPad}>{children}</main>
        <SiteFooter hasBottomNav={!!user} />
      </body>
    </html>
  );
}
