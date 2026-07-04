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
  blockedRanges: Array<{ startDate: string; endDate: string; type: "reserved" | "temporary" }>;
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
        style: { color: "#cbd5e1", textDecoration: "line-through", pointerEvents: "none" as const },
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
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link href="/" className="btn-secondary mb-4 inline-flex">
        بازگشت به خانه
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a365d] md:text-3xl">{property.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{property.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#1a365d]/10 px-3 py-1 text-xs font-medium text-[#1a365d]">
              ظرفیت {property.capacity} نفر
            </span>
            <span className="rounded-full bg-[#1a365d]/10 px-3 py-1 text-xs font-medium text-[#1a365d]">
              {property.bedrooms} خواب
            </span>
            <span className="rounded-full bg-[#c9a227]/20 px-3 py-1 text-sm font-bold text-[#1a365d]">
              {toToman(property.dailyPrice)} / هر شب
            </span>
          </div>
        </div>
        {displayStatus && <StatusBadge status={displayStatus} size="md" />}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="order-2 space-y-8 lg:order-1 lg:col-span-2">
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

        <div className="order-1 lg:order-2 lg:col-span-1">
          <div className="card space-y-4 lg:sticky lg:top-4">
            <h2 className="text-lg font-bold text-[#1a365d]">رزرو اقامت</h2>

            {!propertyOpen && (
              <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">رزرو این ویلا توسط ادمین غیرفعال شده است.</p>
            )}

            {availability && propertyOpen && (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 space-y-1">
                <p>
                  <span className="font-medium">راهنمای تقویم:</span>{" "}
                  {startDate && endDate ? selection.message : GLOBAL_HINT[availability.availability]}
                </p>
                <p>حداکثر اقامت: {availability.maxStayDays} روز</p>
                <p>مهلت تکمیل پرداخت: {availability.paymentHoldHours} ساعت</p>
                {blockedRanges.length > 0 && (
                  <p className="text-slate-500">
                    {blockedRanges.filter((r) => r.type === "reserved").length} بازه رزرو شده،{" "}
                    {blockedRanges.filter((r) => r.type === "temporary").length} بازه موقت
                  </p>
                )}
              </div>
            )}

            <div className={`grid gap-3 ${pickerDisabled ? "pointer-events-none opacity-50" : ""}`}>
              <div>
                <label className="mb-1 block text-xs text-slate-500">تاریخ ورود</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={startDate || ""}
                  onChange={pickStart}
                  inputClass="input"
                  format="YYYY/MM/DD"
                  minDate={minCheckIn}
                  mapDays={({ date }) => mapDayProps(date)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">تاریخ خروج</label>
                <DatePicker
                  calendar={persian}
                  locale={persian_fa}
                  value={endDate || ""}
                  onChange={pickEnd}
                  inputClass="input"
                  format="YYYY/MM/DD"
                  minDate={startDate || minCheckIn}
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
              className="btn-primary min-h-12 w-full text-base"
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
              className="text-xs text-blue-700 underline"
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
