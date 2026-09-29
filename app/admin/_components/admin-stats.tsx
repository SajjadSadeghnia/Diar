import Link from "next/link";
import { Building2, Calendar, Clock } from "lucide-react";
import { StatCard } from "@/components/stat-card";

interface AdminStatsProps {
  property: { title: string } | null;
  bookingCount: number;
  paymentCount: number;
}

export function AdminStats({ property, bookingCount, paymentCount }: AdminStatsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <StatCard
        label="ویلای سازمانی"
        value={property?.title || "تنظیم نشده"}
        valueClassName="text-lg"
        icon={<Building2 className="h-5 w-5" />}
        accent="ink"
        caption={
          property ? (
            <Link href="/admin/properties" className="text-ink hover:underline">
              ویرایش ملک
            </Link>
          ) : (
            "ابتدا ملک را در بخش ویرایش تنظیم کنید"
          )
        }
      />
      <StatCard
        label="تعداد رزروها"
        value={bookingCount}
        icon={<Calendar className="h-5 w-5" />}
        accent="ink"
        caption="رزرو ثبت شده"
      />
      <StatCard
        label="پرداخت‌های در انتظار"
        value={paymentCount}
        icon={<Clock className="h-5 w-5" />}
        accent="clay"
        caption="نیاز به بررسی"
      />
    </section>
  );
}
