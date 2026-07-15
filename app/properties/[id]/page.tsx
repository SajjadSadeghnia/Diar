"use client";

import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import type { DateObject } from "react-multi-date-picker";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PropertyGallery } from "@/components/property-gallery";
import { PropertyInfoSections } from "@/components/property-info-sections";
import { StatusBadge } from "@/components/status-badge";
import {
  evaluateDateSelection,
  isDateDisabled,
  parseApiBlockedRanges,
  type PropertyAvailabilityState,
} from "@/lib/booking-utils";
import { type PropertyPresentation, toPropertyPresentation } from "@/lib/property-details";
import { toToman } from "@/lib/utils";

type Property = PropertyPresentation;

type AvailabilityPayload = {
  availability: PropertyAvailabilityState;
  blockedRanges: Array<{ startDate: string; endDate: string; type: "reserved" | "temporary" | "closed" }>;
  minCheckInDate: string;
  maxStayDays: number;
  paymentHoldHours: number;
};

const GLOBAL_HINT: Record<PropertyAvailabilityState, string> = {
  available: "تقویم باز است — تاریخ مورد نظر را انتخاب کنید",
  temporarily_reserved: "",
  reserved: "برخی تاریخ‌ها قبلاً رزرو شده‌اند — فقط روزهای آزاد قابل انتخاب هستند",
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [availability, setAvailability] = useState<AvailabilityPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const loadAvailability = useCallback(async () => {
    const res = await fetch(`/api/properties/${id}/availability`, {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok) setAvailability(data);
  }, [id]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/properties/${id}`, { credentials: "include", cache: "no-store" }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "خطا در دریافت اطلاعات ملک");
        setProperty(
          toPropertyPresentation({
            ...data,
            status: data.dbStatus ?? data.status,
          })
        );
      }),
      loadAvailability(),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    const interval = setInterval(loadAvailability, 60_000);
    return () => clearInterval(interval);
  }, [id, loadAvailability]);

  const blockedRanges = useMemo(
    () => (availability ? parseApiBlockedRanges(availability.blockedRanges) : []),
    [availability]
  );

  const minCheckIn = useMemo(
    () => (availability ? new Date(availability.minCheckInDate) : new Date()),
    [availability]
  );

  const selection = useMemo(
    () => evaluateDateSelection(startDate, endDate, blockedRanges),
    [startDate, endDate, blockedRanges]
  );

  const displayStatus: PropertyAvailabilityState | null =
    startDate && endDate ? selection.state : availability?.availability ?? null;

  const propertyOpen = property?.dbStatus === "available";
  const canSubmit = propertyOpen && selection.canBook && !submitting;

  function pickStart(value: DateObject | null) {
    const d = value?.toDate?.() ?? null;
    if (!d) {
      setStartDate(null);
      return;
    }
    if (isDateDisabled(d, blockedRanges, minCheckIn)) {
      setError("این تاریخ غیرقابل انتخاب است");
      return;
    }
    setStartDate(d);
    setError("");
    if (endDate && d >= endDate) setEndDate(null);
  }

  function pickEnd(value: DateObject | null) {
    const d = value?.toDate?.() ?? null;
    if (!d) {
      setEndDate(null);
      return;
    }
    if (isDateDisabled(d, blockedRanges, minCheckIn)) {
      setError("این تاریخ غیرقابل انتخاب است");
      return;
    }
    if (startDate && d <= startDate) {
      setError("تاریخ خروج باید بعد از تاریخ ورود باشد");
      return;
    }
    setEndDate(d);
    setError("");
  }

  function mapDayProps(date: DateObject) {
    if (isDateDisabled(date.toDate(), blockedRanges, minCheckIn)) {
      return {
        disabled: true,
        style: { color: "var(--color-line)", textDecoration: "line-through", pointerEvents: "none" as const },
      };
    }
    return {};
  }

  async function startReservation() {
    if (!canSubmit || !startDate || !endDate) return;

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ایجاد رزرو");
      }

      router.push(`/payment/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ثبت رزرو");
      await loadAvailability();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6">در حال بارگذاری...</div>;
  if (!property) return <div className="p-6">ملک پیدا نشد</div>;

  const pickerDisabled = !propertyOpen || !availability;
  const details = property.details;

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-4 py-6">
      <Link href="/" className="btn-secondary mb-4 inline-flex">
        بازگشت به خانه
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-display break-words text-2xl font-semibold text-ink md:text-3xl">{property.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-charcoal-muted">{property.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-medium text-ink">
              ظرفیت {property.capacity} نفر
            </span>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-medium text-ink">
              {property.bedrooms} خواب
            </span>
            <span className="max-w-full break-words rounded-full bg-clay/10 px-3 py-1 text-xs font-bold text-clay sm:text-sm">
              {toToman(property.dailyPrice)} / هر شب
            </span>
          </div>
        </div>
        {displayStatus && (
          <div className="shrink-0 self-start">
            <StatusBadge status={displayStatus} size="md" />
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:col-span-2 lg:space-y-8">
          <PropertyGallery images={property.images} title={property.title} />
          <PropertyInfoSections
            capacity={property.capacity}
            bedrooms={property.bedrooms}
            bathroomInfo={property.bathroomInfo}
            seaDistance={property.seaDistance}
            mobileSignal={property.mobileSignal}
            address={property.address}
            mapUrl={property.mapUrl}
            details={details}
          />
        </div>

        <div className="order-1 min-w-0 lg:order-2 lg:col-span-1">
          <div className="card space-y-4 lg:sticky lg:top-20">
            <h2 className="font-display text-lg font-semibold text-ink">رزرو اقامت</h2>

            {!propertyOpen && (
              <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">رزرو این ویلا توسط ادمین غیرفعال شده است.</p>
            )}

            {availability && propertyOpen && (
              <div className="rounded-lg bg-canvas p-3 text-sm text-charcoal-muted space-y-1">
                <p>
                  <span className="font-medium">راهنمای تقویم:</span>{" "}
                  {startDate && endDate ? selection.message : GLOBAL_HINT[availability.availability]}
                </p>
                <p>حداکثر اقامت: {availability.maxStayDays} روز</p>
                <p>مهلت تکمیل پرداخت: {availability.paymentHoldHours} ساعت</p>
                {blockedRanges.length > 0 && (
                  <p className="text-charcoal-muted/70">
                    {blockedRanges.filter((r) => r.type === "reserved").length} بازه رزرو شده،{" "}
                    {blockedRanges.filter((r) => r.type === "temporary").length} بازه موقت
                  </p>
                )}
              </div>
            )}

            <div className={`grid min-w-0 gap-3 ${pickerDisabled ? "pointer-events-none opacity-50" : ""}`}>
              <div className="property-date-picker min-w-0 w-full">
                <label className="mb-1 block text-xs text-charcoal-muted/70">تاریخ ورود</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={startDate || ""}
                  onChange={pickStart}
                  containerClassName="w-full"
                  inputClass="input w-full"
                  className="w-full"
                  format="YYYY/MM/DD"
                  minDate={minCheckIn}
                  calendarPosition="bottom-right"
                  portal
                  mapDays={({ date }) => mapDayProps(date)}
                />
              </div>
              <div className="property-date-picker min-w-0 w-full">
                <label className="mb-1 block text-xs text-charcoal-muted/70">تاریخ خروج</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={endDate || ""}
                  onChange={pickEnd}
                  containerClassName="w-full"
                  inputClass="input w-full"
                  className="w-full"
                  format="YYYY/MM/DD"
                  minDate={startDate || minCheckIn}
                  calendarPosition="bottom-right"
                  portal
                  mapDays={({ date }) => mapDayProps(date)}
                />
              </div>
            </div>

            {startDate && endDate && !selection.canBook && (
              <p className="text-sm text-amber-700">{selection.message}</p>
            )}
            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="button"
              className="btn-primary min-h-12 w-full text-base duration-200 hover:-translate-y-0.5 hover:brightness-110"
              onClick={startReservation}
              disabled={!canSubmit}
            >
              {submitting
                ? "در حال ثبت رزرو موقت..."
                : !propertyOpen
                  ? "رزرو غیرفعال است"
                  : !startDate || !endDate
                    ? "ابتدا تاریخ‌ها را انتخاب کنید"
                    : !selection.canBook
                      ? selection.message
                      : "رزرو"}
            </button>

            <button
              type="button"
              className="text-xs text-ink underline"
              onClick={() => loadAvailability()}
            >
              بروزرسانی وضعیت تقویم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
