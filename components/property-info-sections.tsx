import {
  Users,
  BedDouble,
  Bath,
  Waves,
  MapPin,
  Car,
  Signal,
  UtensilsCrossed,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { PropertyDetailsJson } from "@/lib/property-details";

type PropertyInfoSectionsProps = {
  capacity: number;
  bedrooms: number;
  bathroomInfo: string;
  seaDistance: string;
  mobileSignal: string;
  address: string;
  mapUrl: string | null;
  details: PropertyDetailsJson;
};

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-line/60 bg-canvas/60 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/10 text-ink">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <div className="mt-1 text-sm text-charcoal-muted leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export function PropertyInfoSections({
  capacity,
  bedrooms,
  bathroomInfo,
  seaDistance,
  mobileSignal,
  address,
  mapUrl,
  details,
}: PropertyInfoSectionsProps) {
  return (
    <div className="min-w-0 w-full space-y-6">
      <section className="card min-w-0">
        <h2 className="mb-4 text-lg font-bold text-ink">اطلاعات کلی واحد</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailRow icon={Users} label="ظرفیت (تعداد نفرات)">
            {capacity} نفر
          </DetailRow>
          <DetailRow icon={BedDouble} label="سرویس خواب">
            {bedrooms} خواب
          </DetailRow>
          <DetailRow icon={Bath} label="سرویس بهداشتی">
            {bathroomInfo}
          </DetailRow>
          <DetailRow icon={Waves} label="فاصله با دریا">
            {seaDistance}
          </DetailRow>
          <DetailRow icon={Signal} label="آنتن‌دهی موبایل">
            {mobileSignal}
          </DetailRow>
          <DetailRow icon={MapPin} label="آدرس">
            <p className="whitespace-pre-line">{address}</p>
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex max-w-full items-center gap-2 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-hover"
              >
                <ExternalLink className="h-4 w-4" />
                مشاهده موقعیت روی نقشه
              </a>
            )}
          </DetailRow>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">دسترسی و موقعیت مکانی</h2>
        <p className="mb-3 text-sm text-charcoal-muted">کاملاً در دسترس و نزدیک به:</p>
        <ul className="grid gap-2 sm:grid-cols-3">
          {details.accessNearby.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">پارکینگ</h2>
        <ul className="space-y-2">
          {details.parking.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-charcoal-muted">
              <Car className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">لوازم سرو غذا</h2>
        <div className="flex flex-wrap gap-2">
          {details.diningItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas-raised px-3 py-1.5 text-sm text-charcoal-muted"
            >
              <UtensilsCrossed className="h-3.5 w-3.5 text-clay-soft" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-bold text-ink">امکانات و تجهیزات</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {details.amenities.map((a) => {
            const available = a.value === "دارد";
            return (
              <div
                key={a.key}
                className={`rounded-xl border p-3 text-center text-sm transition-shadow duration-200 hover:shadow-md ${
                  available
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-line bg-canvas text-charcoal-muted"
                }`}
              >
                <div className="mb-1 flex justify-center">
                  {available ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-charcoal-muted/50" />
                  )}
                </div>
                <p className="font-medium">{a.label}</p>
                <p className="mt-0.5 text-xs opacity-80">{a.value}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
