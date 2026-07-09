// Booking utilities — check-in/check-out, availability, validation (دیار)

export const CHECK_IN_HOUR = 12;
export const CHECK_OUT_HOUR = 12;
export const PAYMENT_HOLD_HOURS = 2;
export const PAYMENT_HOLD_MS = PAYMENT_HOLD_HOURS * 60 * 60 * 1000;
export const MAX_STAY_DAYS = 3;
export const MIN_ADVANCE_DAYS = 1;
export const COOLDOWN_DAYS = 10;

export type DateBlockType = "reserved" | "temporary" | "closed";
export type PropertyAvailabilityState = "available" | "temporarily_reserved" | "reserved";

export type BookingRange = {
  startDate: Date;
  endDate: Date;
  status: string;
  expiresAt?: Date | null;
  /** True when receipt uploaded — 2h hold no longer applies; dates stay blocked until admin decides */
  hasPayment?: boolean;
};

export function getCheckInTime(date: Date): Date {
  const d = new Date(date);
  d.setHours(CHECK_IN_HOUR, 0, 0, 0);
  return d;
}

export function getCheckoutTime(endDate: Date): Date {
  const checkout = new Date(endDate);
  checkout.setHours(CHECK_OUT_HOUR, 0, 0, 0);
  return checkout;
}

export function getPaymentExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + PAYMENT_HOLD_MS);
}

/** Canonical instant for a calendar day's night — used as the DateOverride key. */
export function getNightKey(date: Date): Date {
  return getCheckInTime(date);
}

/** Start instants of every night in [startDate, endDate) — one per stay night. */
export function enumerateNights(startDate: Date, endDate: Date): Date[] {
  const nights = calcStayDays(startDate, endDate);
  const first = getCheckInTime(startDate);
  const result: Date[] = [];
  for (let i = 0; i < nights; i++) {
    const n = new Date(first);
    n.setDate(n.getDate() + i);
    result.push(n);
  }
  return result;
}

/** A closed calendar day blocks the night [12:00 that day, 12:00 next day). */
export function closedDateToRange(date: Date): { startDate: Date; endDate: Date; type: "closed" } {
  const startDate = getCheckInTime(date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 1);
  return { startDate, endDate, type: "closed" };
}

export function calcStayDays(startDate: Date, endDate: Date): number {
  const start = getCheckInTime(startDate);
  const end = getCheckInTime(endDate);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / oneDay));
}

export function isBookingExpired(
  booking: {
    status: string;
    expiresAt?: Date | null;
    payment?: unknown | null;
    hasPayment?: boolean;
  },
  now: Date = new Date()
): boolean {
  if (booking.status !== "pending_payment") return false;
  if (booking.hasPayment || booking.payment) return false;
  if (!booking.expiresAt) return true;
  return booking.expiresAt <= now;
}

export function toBookingRange(b: {
  startDate: Date;
  endDate: Date;
  status: string;
  expiresAt?: Date | null;
  payment?: { id: string } | null;
}): BookingRange {
  return {
    startDate: b.startDate,
    endDate: b.endDate,
    status: b.status,
    expiresAt: b.expiresAt,
    hasPayment: Boolean(b.payment),
  };
}

/** Whether this booking currently blocks calendar dates */
export function isBookingBlocking(booking: BookingRange, now: Date = new Date()): boolean {
  if (booking.status === "approved") {
    return true;
  }
  if (booking.status === "pending_payment") {
    return !isBookingExpired(booking, now);
  }
  return false;
}

export function doRangesOverlap(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
  const checkIn1 = getCheckInTime(start1);
  const checkout1 = getCheckoutTime(end1);
  const checkIn2 = getCheckInTime(start2);
  const checkout2 = getCheckoutTime(end2);
  return checkIn1 < checkout2 && checkIn2 < checkout1;
}

export function hasBookingOverlap(
  newStart: Date,
  newEnd: Date,
  existingBookings: BookingRange[],
  now: Date = new Date()
): boolean {
  const blocking = existingBookings.filter((b) => isBookingBlocking(b, now));
  return blocking.some((b) => doRangesOverlap(newStart, newEnd, b.startDate, b.endDate));
}

export function getEarliestCheckInDate(now: Date = new Date()): Date {
  const earliest = new Date(now);
  earliest.setDate(earliest.getDate() + MIN_ADVANCE_DAYS);
  earliest.setHours(CHECK_IN_HOUR, 0, 0, 0);
  return earliest;
}

export function getCooldownEndsAt(lastApprovedEndDate: Date): Date {
  const checkout = getCheckoutTime(lastApprovedEndDate);
  const cooldownEnd = new Date(checkout);
  cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);
  cooldownEnd.setHours(CHECK_IN_HOUR, 0, 0, 0);
  return cooldownEnd;
}

export function validateBookingDates(
  startDate: Date,
  endDate: Date,
  now: Date = new Date()
): { valid: boolean; error?: string } {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { valid: false, error: "تاریخ‌های نامعتبر" };
  }

  const checkIn = getCheckInTime(startDate);
  const checkOut = getCheckInTime(endDate);

  if (checkOut <= checkIn) {
    return { valid: false, error: "بازه تاریخ نامعتبر است. تاریخ پایان باید بعد از تاریخ شروع باشد." };
  }

  const stayDays = calcStayDays(startDate, endDate);
  if (stayDays > MAX_STAY_DAYS) {
    return { valid: false, error: `حداکثر مدت رزرو ${MAX_STAY_DAYS} روز است.` };
  }

  const earliest = getEarliestCheckInDate(now);
  if (checkIn < earliest) {
    return {
      valid: false,
      error: "رزرو باید حداقل یک روز قبل از روز ورود (ساعت ۱۲ ظهر) نهایی شود. امکان رزرو همان‌روز وجود ندارد.",
    };
  }

  return { valid: true };
}

export function validateCooldown(
  newStartDate: Date,
  lastApprovedEndDate: Date | null,
  now: Date = new Date()
): { valid: boolean; error?: string } {
  if (!lastApprovedEndDate) return { valid: true };

  const cooldownEnd = getCooldownEndsAt(lastApprovedEndDate);
  const checkIn = getCheckInTime(newStartDate);

  if (checkIn < cooldownEnd) {
    return {
      valid: false,
      error: `پس از پایان آخرین رزرو تاییدشده، ${COOLDOWN_DAYS} روز کامل باید بگذرد تا رزرو بعدی مجاز شود.`,
    };
  }

  return { valid: true };
}

export function getBlockedRanges(
  bookings: BookingRange[],
  now: Date = new Date()
): Array<{ startDate: Date; endDate: Date; type: DateBlockType }> {
  return bookings
    .filter((b) => isBookingBlocking(b, now))
    .map((b) => ({
      startDate: b.startDate,
      endDate: b.endDate,
      type: b.status === "approved" ? ("reserved" as const) : ("temporary" as const),
    }));
}

export function getPropertyAvailabilityState(
  bookings: BookingRange[],
  now: Date = new Date()
): PropertyAvailabilityState {
  const blocking = bookings.filter((b) => isBookingBlocking(b, now));
  if (!blocking.length) return "available";
  if (blocking.some((b) => b.status === "approved")) return "reserved";
  return "temporarily_reserved";
}

/** Legacy helper for property list — maps to available/unavailable */
export function getPropertyAvailability(
  approvedBookings: Array<{ startDate: Date; endDate: Date }>,
  currentTime: Date = new Date()
): "available" | "unavailable" {
  const state = getPropertyAvailabilityState(
    approvedBookings.map((b) => ({ ...b, status: "approved" })),
    currentTime
  );
  return state === "available" ? "available" : "unavailable";
}

export function isDateDisabled(
  date: Date,
  blockedRanges: Array<{ startDate: Date; endDate: Date }>,
  earliestCheckIn: Date
): boolean {
  const day = new Date(date);
  day.setHours(12, 0, 0, 0);

  if (day < earliestCheckIn) return true;

  return blockedRanges.some((r) => {
    const start = getCheckInTime(r.startDate);
    const end = getCheckoutTime(r.endDate);
    return day >= start && day < end;
  });
}

export const AVAILABILITY_LABELS: Record<PropertyAvailabilityState, string> = {
  available: "قابل رزرو",
  temporarily_reserved: "رزرو موقت (۲ ساعته)",
  reserved: "رزرو شده",
};

export function parseApiBlockedRanges(
  ranges: Array<{ startDate: string; endDate: string; type: DateBlockType }>
): Array<{ startDate: Date; endDate: Date; type: DateBlockType }> {
  return ranges.map((r) => ({
    startDate: new Date(r.startDate),
    endDate: new Date(r.endDate),
    type: r.type,
  }));
}

/** True if [start, end] overlaps any blocked range (12:00 check-in/out). */
export function rangeOverlapsBlocked(
  start: Date,
  end: Date,
  blockedRanges: Array<{ startDate: Date; endDate: Date; type: DateBlockType }>
): { overlaps: boolean; conflictType?: DateBlockType } {
  for (const r of blockedRanges) {
    if (doRangesOverlap(start, end, r.startDate, r.endDate)) {
      return { overlaps: true, conflictType: r.type };
    }
  }
  return { overlaps: false };
}

export function getOverlapMessage(conflictType?: DateBlockType): string {
  if (conflictType === "reserved") return "این تاریخ قبلاً رزرو شده است";
  if (conflictType === "temporary") return "این بازه زمانی در حال رزرو است";
  if (conflictType === "closed") return "این تاریخ توسط مدیریت بسته شده است";
  return "این بازه زمانی قابل رزرو نیست";
}

/** Availability for a specific selected range (not whole property). */
export function getSelectionAvailabilityState(
  start: Date,
  end: Date,
  blockedRanges: Array<{ startDate: Date; endDate: Date; type: DateBlockType }>
): PropertyAvailabilityState {
  const { overlaps, conflictType } = rangeOverlapsBlocked(start, end, blockedRanges);
  if (!overlaps) return "available";
  return conflictType === "temporary" ? "temporarily_reserved" : "reserved";
}

export type SelectionEvaluation = {
  state: PropertyAvailabilityState | null;
  canBook: boolean;
  message: string;
};

export function evaluateDateSelection(
  start: Date | null,
  end: Date | null,
  blockedRanges: Array<{ startDate: Date; endDate: Date; type: DateBlockType }>,
  now: Date = new Date()
): SelectionEvaluation {
  if (!start || !end) {
    return { state: null, canBook: false, message: "لطفا بازه ورود و خروج را انتخاب کنید" };
  }

  const dateValidation = validateBookingDates(start, end, now);
  if (!dateValidation.valid) {
    return { state: null, canBook: false, message: dateValidation.error || "بازه تاریخ نامعتبر است" };
  }

  const overlap = rangeOverlapsBlocked(start, end, blockedRanges);
  if (overlap.overlaps) {
    const state = overlap.conflictType === "temporary" ? "temporarily_reserved" : "reserved";
    return { state, canBook: false, message: getOverlapMessage(overlap.conflictType) };
  }

  return { state: "available", canBook: true, message: "بازه انتخابی قابل رزرو است" };
}

/** Show 2h payment countdown only while receipt not uploaded (UI only). */
export function shouldShowPaymentCountdown(booking: {
  status: string;
  payment?: unknown | null;
}): boolean {
  return booking.status === "pending_payment" && booking.payment == null;
}

export function isAwaitingAdminReview(booking: {
  status: string;
  payment?: unknown | null;
}): boolean {
  return booking.status === "pending_payment" && booking.payment != null;
}

export function getBookingDisplayStatus(booking: {
  status: string;
  payment?: unknown | null;
}): string {
  if (isAwaitingAdminReview(booking)) return "awaiting_admin_review";
  return booking.status;
}

export function formatRemainingMs(expiresAt: Date, now: Date = new Date()): string {
  const diff = expiresAt.getTime() - now.getTime();
  if (diff <= 0) return "منقضی شده";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} ساعت و ${minutes} دقیقه`;
  return `${minutes} دقیقه`;
}
