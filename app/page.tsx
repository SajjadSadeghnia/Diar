import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { fetchBlockingBookings } from "@/lib/booking-lifecycle";
import { getPropertyAvailabilityState, toBookingRange } from "@/lib/booking-utils";
import { getHomepageAmenityPreview, parsePropertyDetails } from "@/lib/property-details";
import { getSingleProperty } from "@/lib/property";
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
        <Image src="/brand/hero-shepherd.jpg" alt="دیار" fill className="animate-ken-burns object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        <div className="relative mx-auto max-w-4xl px-4 py-24">
          <div className="space-y-8 text-white">
            <header className="space-y-5">
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                رزرو <span className="text-clay-soft">ویلای سازمانی</span> دیار
              </h1>
              <h2 className="text-xl font-medium leading-relaxed text-white/95 sm:text-2xl">
                جایی برای چند لحظه آسودن،
                <br />
                بین شلوغی شهر و فشار کار
              </h2>
            </header>

            <div className="max-w-xl space-y-5 text-base leading-8 text-white/90 sm:text-lg sm:leading-9">
              <p>
                دیار از یک ایده شروع شد؛
                <br />
                جایی که گاهی بایستید، نفس عمیقی بکشید
                <br />
                و دوباره حضور در لحظه را حس کنید.
              </p>
              <p>
                دیار برای ما فقط یک اسم نیست؛ حسِ خانه است.
                <br />
                همان جایی که آدم دلش می‌خواهد
                <br />
                چراغش همیشه روشن بماند.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              {property && (
                <Link
                  href={user ? `/properties/${property.id}` : "/login"}
                  className="btn-secondary inline-flex items-center gap-2 !border-white/50 !text-white duration-200 hover:-translate-y-0.5 hover:!border-white hover:!bg-white/10"
                >
                  ورود به فرصت‌های دیار <ArrowLeft className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <ScrollReveal>
        <section className="py-16">
          <div className="prose-block mx-auto max-w-3xl px-4">
            <p>
              دیار برای ما، تکه‌ای از دلِ ماست؛
              و دوست داریم هر روز بزرگ‌تر شود، نه فقط در ظاهر، بلکه در حس خوبی که منتقل می‌کند.
            </p>
            <p>
              در خاطره‌هایی که می‌سازد و در آرامشی که به آدم‌ها هدیه می‌دهد،
              این تازه شروع راه ماست.
            </p>
            <p>
              قرار است در دیار اتفاق‌های جذاب‌تری شکل بگیرد، آدم‌های بیشتری همراه شوند
              و هر روز بیشتر از قبل، رنگِ زندگی به خودش بگیرد.
            </p>
            <p>
              دیار، ثمره‌ی کلید ماست؛ بخشی از فکرها، تصمیم‌ها، سلیقه و حال خوب ما.
              جایی که با دقت انتخاب شده و حالا با عشق، آماده‌ی میزبانی از شماست.
            </p>
            <p>قدم‌تون روی چشم. خوش اومدید به دیار.</p>
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal>
        <section className="py-16">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <div className="radius-photo relative h-72 overflow-hidden shadow-lg lg:h-96">
              <Image src="/brand/why-diar-window.jpg" alt="چرا دیار؟" fill className="object-cover" />
            </div>
            <div className="prose-block">
              <h2 className="section-title !text-ink">چرا دیار؟</h2>
              <p>
                دیار یعنی جایی که حضور، مهم‌تر از سرعت است
                و بودن، ارزشمندتر از رسیدن.
              </p>
              <p>
                ما باور داریم هرجا که آدم‌ها لحظه‌ای حال خوب را تجربه کنند،
                همان‌جا دیار است؛ حتی اگر اسمش را ندانند.
              </p>
              <p>
                دیار را باید آرام ساخت و آرام نگه داشت؛
                با مراقبت، با حواس، با دل.
              </p>
              <p>چون بعضی جاها فقط فضا نیستند — تکه‌ای از زندگی‌اند.</p>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {property && (
        <ScrollReveal>
          <section className="bg-canvas-raised py-16">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 text-center">
                <h2 className="section-title">ویلای سازمانی</h2>
                <p className="text-charcoal-muted">واحد اختصاصی شرکت در مجتمع نگین نور — شهر نور</p>
              </div>
              <div className="mx-auto max-w-4xl">
                <Link
                  href={user ? `/properties/${property.id}` : "/login"}
                  className="block cursor-pointer overflow-hidden rounded-2xl bg-canvas-raised shadow-lg transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-xl"
                >
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
                    <h3 className="font-display text-xl font-semibold text-ink">{property.title}</h3>
                    <p className="line-clamp-3 text-charcoal-muted">{property.description}</p>
                    <p className="flex items-start gap-2 text-sm text-charcoal-muted">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                      <span className="line-clamp-2 whitespace-pre-line">{property.address}</span>
                    </p>
                    {amenityPreview.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {amenityPreview.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-line bg-canvas px-2.5 py-1 text-xs text-charcoal-muted"
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
        </ScrollReveal>
      )}

      <ScrollReveal>
        <section className="py-16">
          <div className="mx-auto max-w-4xl rounded-2xl bg-gradient-to-r from-ink to-ink-hover px-6 py-14 text-center text-white">
            <h2 className="section-title text-white">آماده ثبت رزرو هستید؟</h2>
            <p className="mt-3 text-white/80">وارد شوید، تاریخ اقامت را انتخاب کنید و رسید را بارگذاری کنید.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {property && (
                <Link
                  href={user ? `/properties/${property.id}` : "/login"}
                  className="btn-accent min-h-12 px-6 py-3 text-base duration-200 hover:-translate-y-0.5"
                >
                  شروع رزرو
                </Link>
              )}
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
