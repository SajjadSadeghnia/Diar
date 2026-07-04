import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import { getPropertyAvailabilityState, toBookingRange } from "@/lib/booking-utils";
import { getHomepageAmenityPreview, parsePropertyDetails } from "@/lib/property-details";
import { getSingleProperty } from "@/lib/property";
import { prisma } from "@/lib/prisma";
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

  const details = property ? parsePropertyDetails(property.detailsJson) : null;
  const amenityPreview = details ? getHomepageAmenityPreview(details) : [];

  return (
    <div>
      <section className="relative min-h-[85vh] overflow-hidden">
        <Image src="/brand/hero-shepherd.jpg" alt="دیار" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        <div className="relative mx-auto max-w-4xl px-4 py-24">
          <div className="space-y-8 text-white">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
              رزرو <span className="text-[#c9a227]">ویلای سازمانی</span> دیار
            </h1>
            <div className="max-w-xl space-y-4 text-lg text-gray-100 md:text-xl">
              <p>
                دیار از یک ایده شروع شد؛<br />
                اینکه جایی باشه برای چند لحظه آسودن.<br />
                جایی که بین شلوغی شهر و فشار کار، گاهی بایستید، نفس عمیقی بکشید و دوباره حضور در لحظه را حس کنید.
              </p>
              <p>
                دیار برای ما فقط یک اسم نیست؛<br />
                حسِ خانه است.<br />
                همان جایی که آدم دلش می‌خواهد چراغش همیشه روشن بماند.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {property && (
                <Link
                  href={user ? `/properties/${property.id}` : "/login"}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  ورود به فرصت‌های دیار <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-6 px-4 text-lg leading-relaxed text-gray-700">
          <p>
            دیار برای ما، تکه‌ای از دلِ ماست؛<br />
            و دوست داریم هر روز بزرگ‌تر شود…<br />
            نه فقط در ظاهر، بلکه در حس خوبی که منتقل می‌کند، در خاطره‌هایی که می‌سازد و در آرامشی که به آدم‌ها هدیه می‌دهد.
          </p>
          <p>
            البته این تازه شروع راه ماست.<br />
            قراره در دیار اتفاق‌های جذاب‌تری شکل بگیره، آدم‌های بیشتری همراه بشوند و اینجا، هر روز بیشتر از قبل، رنگِ زندگی به خودش بگیره.
          </p>
          <p>
            دیار، ثمره‌ی کلید ماست؛<br />
            بخشی از فکرها، تصمیم‌ها، سلیقه و حال خوب ما.<br />
            جایی که با دقت انتخاب شده، آرام‌آرام شکل گرفته و حالا با عشق و حس خوب، آماده‌ی میزبانی از شماست.
          </p>
          <p>
            قدم‌تون روی چشم.<br />
            خوش اومدید به دیار.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
          <div className="relative h-72 overflow-hidden rounded-2xl shadow-lg lg:h-96">
            <Image src="/brand/why-diar-window.jpg" alt="چرا دیار؟" fill className="object-cover" />
          </div>
          <div className="space-y-4 text-lg leading-relaxed text-gray-700">
            <h2 className="section-title mb-4">چرا دیار؟</h2>
            <p>
              دیار یعنی<br />
              جایی که حضور، مهم‌تر از سرعت است.<br />
              جایی که بودن، ارزشمندتر از رسیدن است.
            </p>
            <p>
              و ما باور داریم<br />
              هرجا که آدم‌ها لحظه‌ای حال خوب را تجربه کنند،<br />
              همان‌جا دیار است؛<br />
              حتی اگر اسمش را ندانند.
            </p>
            <p>
              دیار را باید آرام ساخت…<br />
              و آرام نگه داشت.<br />
              با مراقبت، با حواس، با دل.
            </p>
            <p>
              چون بعضی جاها فقط فضا نیستند…<br />
              تکه‌ای از زندگی‌اند.
            </p>
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
    </div>
  );
}
