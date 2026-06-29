import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const vazir = Vazirmatn({ subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "دیار | سامانه رزرو ویلای سازمانی",
  description: "سامانه داخلی رزرو ویلای سازمانی دیار",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.className} min-h-screen`}>
        <SiteHeader />
        <main className="pb-20 md:pb-0">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
