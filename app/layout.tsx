import type { Metadata } from "next";
import { Noto_Naskh_Arabic, Vazirmatn } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const vazir = Vazirmatn({ subsets: ["arabic"] });
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "دیار | سامانه رزرو ویلای سازمانی",
  description: "سامانه داخلی رزرو ویلای سازمانی دیار",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={notoNaskhArabic.variable}>
      <body className={`${vazir.className} min-h-screen`}>
        <SiteHeader />
        <main className="pb-24 md:pb-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
