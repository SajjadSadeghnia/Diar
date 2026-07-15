import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
  return (
    <html lang="fa" dir="rtl" className={vazir.variable}>
      <body className={`${vazir.className} min-h-screen`}>
        <SiteHeader />
        <main className="pb-24 md:pb-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
