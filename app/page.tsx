import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle, Clock, MapPin, Shield, Users } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import { AVAILABILITY_LABELS, getPropertyAvailabilityState, toBookingRange } from "@/lib/booking-utils";
import { getHomepageAmenityPreview, parsePropertyDetails } from "@/lib/property-details";
import { getSingleProperty } from "@/lib/property";
import { prisma } from "@/lib/prisma";
import { toToman } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") redirect("/admin");
  const property = await Promise.race([
    getSingleProperty(),
    new Promise<null>((_, reject) => setTimeout(() => reject(new Error("db-timeout")), 1500)),
  ]).catch(() => null);

  let calendarAvailability: "available" | "temporarily_reserved" | "reserved" = "available";
  if (property) {
    const bookings = await fetchBlockingBookings(property.id);
    calendarAvailability = getPropertyAvailabilityState(bookings.map(toBookingRange));
  }

  const features = [
    { icon: Shield, title: "تایید توسط مدیر", description: "هر رزرو پس از بارگذاری رسید توسط ادمین بررسی می‌شود" },
    { icon: Clock, title: "رزرو شفاف", description: "انتخاب تاریخ، مهلت ۲ ساعته برای پرداخت، و پیگیری وضعیت در همین سامانه" },
    { icon: Users, title: "ویژه کارمندان", description: "دسترسی داخلی — پس از تایید رزرو، شماره تماس پشتیبانی نمایش داده می‌شود" },
  ];

  const details = property ? parsePropertyDetails(property.detailsJson) : null;
  const amenityPreview = details ? getHomepageAmenityPreview(details) : [];
  const locationLine = property?.address ?? "";

  const stats = [
    { number: "۱", label: "ویلای سازمانی" },
    { number: "۲", label: "سرویس خواب" },
    { number: String(property?.capacity ?? 5), label: "ظرفیت (نفر)" },
    { number: "۲", label: "ساعت مهلت پرداخت" },
  ];

  return (
    <div>
      <section className="relative min-h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a365d] via-[#2d4a3e] to-[#1a365d]" />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(#ffffff33 1px, transparent 1px)", backgroundSize: "30px 30px" }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
          <div className="space-y-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c9a227]/20 px-4 py-2 text-[#c9a227]">
              <Building2 className="h-5 w-5" /> ویژه کارمندان شرکت
            </div>

            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
              رزرو <span className="text-[#c9a227]">ویلای سازمانی</span> دیار
            </h1>
            <p className="max-w-xl text-lg text-gray-200 md:text-xl">
              سامانه داخلی رزرو ویلای مازندران برای کارمندان — مشاهده جزئیات، انتخاب تاریخ و ثبت درخواست اقامت.
            </p>

            <div className="flex flex-wrap gap-4">
              {property && (
                <Link
                  href={user ? `/properties/${property.id}` : "/login"}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  مشاهده ویلا و رزرو <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div>
            {property && (
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="relative h-64">
                  <Image src={property.images[0] || "/placeholder-property.svg"} alt={property.title} fill className="object-cover" />
                  <span className="absolute right-4 top-4 rounded-full bg-[#c9a227] px-3 py-1 text-sm text-white">
                    {AVAILABILITY_LABELS[calendarAvailability]}
                  </span>
                </div>
                <div className="space-y-3 p-6">
                  <h3 className="text-xl font-bold text-[#1a365d]">{property.title}</h3>
                  <p className="line-clamp-2 text-sm text-gray-600">{property.description}</p>
                  {locationLine && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{locationLine}</span>
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-[#1a365d]/10 px-2 py-0.5 text-xs text-[#1a365d]">
                      {property.capacity ?? 5} نفر
                    </span>
                    <span className="rounded-full bg-[#1a365d]/10 px-2 py-0.5 text-xs text-[#1a365d]">
                      {property.bedrooms ?? 2} خواب
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[#c9a227]">{toToman(property.dailyPrice)}</p>
                    <Link href={user ? `/properties/${property.id}` : "/login"} className="font-medium text-[#1a365d]">مشاهده جزئیات</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-black text-[#1a365d]">{stat.number}</p>
              <p className="mt-2 text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="section-title mb-8 text-center">چرا ما را انتخاب کنید؟</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card card-hover">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a365d]/10 text-[#1a365d]">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1a365d]">{f.title}</h3>
                <p className="mt-2 text-gray-600">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {property && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 text-center">
              <h2 className="section-title">ویلای سازمانی</h2>
              <p className="text-gray-600">واحد اختصاصی شرکت در مجتمع نگین نور — شهر نور</p>
            </div>
            <div className="mx-auto max-w-4xl">
              <Link href={user ? `/properties/${property.id}` : "/login"} className="card-hover overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="relative h-64">
                  <Image src={property.images[0] || "/placeholder-property.svg"} alt={property.title} fill className="object-cover" />
                  <span className="absolute right-4 top-4 flex gap-2">
                    <StatusBadge status={calendarAvailability} />
                    {property.status === "unavailable" && (
                      <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                        غیرفعال
                      </span>
                    )}
                  </span>
                </div>
                <div className="space-y-4 p-6">
                  <h3 className="text-xl font-bold text-[#1a365d]">{property.title}</h3>
                  <p className="line-clamp-3 text-gray-600">{property.description}</p>
                  <p className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1a365d]" />
                    <span className="line-clamp-2 whitespace-pre-line">{property.address}</span>
                  </p>
                  {amenityPreview.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {amenityPreview.map((label) => (
                        <span
                          key={label}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-lg font-bold text-[#c9a227]">{toToman(property.dailyPrice)} در روز</p>
                    <span className="text-sm text-gray-500">
                      ظرفیت {property.capacity ?? 5} نفر · {property.bedrooms ?? 2} خواب
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-[#1a365d] to-[#2d4a3e] px-6 py-14 text-center text-white">
          <h2 className="text-2xl font-black sm:text-3xl">آماده ثبت رزرو هستید؟</h2>
          <p className="mt-3 text-gray-200">وارد شوید، تاریخ اقامت را انتخاب کنید و رسید را بارگذاری کنید.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {property && (
              <Link
                href={user ? `/properties/${property.id}` : "/login"}
                className="rounded-xl bg-white/10 px-6 py-3 font-medium"
              >
                شروع رزرو
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="section-title mb-6">مزایای خدمات</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "ورود با شماره تماس و رمز اختصاصی کارمندان",
            "انتخاب تاریخ ورود و خروج (ظهر به وقت ایران)",
            "مهلت ۲ ساعته برای بارگذاری رسید پرداخت",
            "پیگیری وضعیت: در انتظار پرداخت، تایید، رد یا منقضی",
            "نمایش شماره تماس پس از تایید نهایی رزرو",
            "مدیریت متمرکز توسط یک ادمین سامانه",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-gray-700"><CheckCircle className="h-5 w-5 text-[#c9a227]" /> {item}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
