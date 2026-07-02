# Diar / دیار — Business Rules

This document is the authoritative specification of every business rule in the system. Any code change that touches these rules must be approved explicitly. When in doubt, this document takes precedence over intuition.

---

## Section 1: Authentication Rules

### 1.1 Login Method
- **Phone number + password only.** Email login does not exist and must never be added.
- Phone numbers are normalized to the format `09XXXXXXXXX` (11 digits, starting with 09).
- Normalization is handled by `lib/phone.ts → normalizePhone()` and `isValidPhone()`.
- Example valid phone: `09121234567`, `09351234567`
- Example invalid: `+989121234567` (normalized first), `021-88776655` (landline, rejected)

### 1.2 Registration
- **No public registration.** The signup page does not exist.
- New accounts are created only via:
  - `scripts/production-bootstrap.ts` (admin account)
  - `scripts/import-employees.ts` (bulk CSV import)
  - Direct Prisma manipulation by the technical lead (exceptional cases only)

### 1.3 Session
- JWT issued on successful login, stored as `httpOnly` cookie named `token`.
- JWT payload: `{ userId, role, name }`
- Token expiry: 7 days.
- No refresh mechanism — after 7 days, user is redirected to login.
- On HTTPS: cookie is `secure: true`, `sameSite: "none"`.
- On HTTP (current production state): cookie is `secure: false`, `sameSite: "lax"`.

### 1.4 Middleware role enforcement
- `proxy.ts` contains the routing logic (note: file naming must be verified — see KNOWN RISKS in PROJECT_MASTER_CONTEXT.md).
- Logic:
  - `/login`: redirect to `/admin` if already logged in as admin; redirect to `/` if already logged in as employee.
  - Any route except `/login` and `/uploads/*`: redirect to `/login` if no token.
  - `/admin/*`: redirect to `/` if role is not `admin`.
  - `/` with role `admin`: redirect to `/admin`.
- API routes each verify authentication independently via `getCurrentUser()` or `getUserFromRequest()`.
- The middleware decodes the JWT role from the cookie WITHOUT signature verification (acceptable for Edge Runtime). The actual security verification happens inside each API route.

---

## Section 2: Booking Lifecycle Rules

### 2.1 Booking Statuses
```
pending_payment  →  approved    (admin approves receipt)
pending_payment  →  rejected    (admin rejects receipt, or admin rejects without receipt)
pending_payment  →  expired     (2h timer expires, no receipt uploaded)
```
There are no other valid transitions. A booking cannot go from `approved` back to `pending_payment`. A booking cannot go from `rejected` or `expired` to any other status.

### 2.2 Creating a Booking
When an employee submits dates:
1. `expireStaleBookings()` is called first inside a DB transaction.
2. The property must have `status = "available"`.
3. The requested date range must not overlap any existing `approved` or `pending_payment` booking that has not expired.
4. The employee must not be in a cooldown period (see Section 4).
5. Date range must pass `validateBookingDates()`:
   - Start must be before end.
   - Stay must not exceed 3 days (`MAX_STAY_DAYS = 3`).
   - Check-in must be at least 1 day in the future from now (`MIN_ADVANCE_DAYS = 1`), measured relative to noon on the check-in day.
6. On success: booking created with `status = "pending_payment"`, `expiresAt = now + 2 hours`.

### 2.3 What "Blocking" Means for Calendar
A booking blocks dates if:
- `status = "approved"` (always blocks), OR
- `status = "pending_payment"` AND (`payment != null` OR `expiresAt > now`)

A booking does NOT block dates if:
- `status = "pending_payment"` AND `payment == null` AND `expiresAt <= now` (stale hold)

### 2.4 Overlap Detection
Uses noon-to-noon check-in/check-out times.
- Check-in is at 12:00 on `startDate`.
- Check-out is at 12:00 on `endDate`.
- Two ranges overlap if: `checkIn1 < checkout2 AND checkIn2 < checkout1`.
- Example: booking A is June 10–12 (check-in Jun 10 noon, check-out Jun 12 noon). Booking B can start June 12 (check-in Jun 12 noon) because `Jun12 noon < Jun12 noon` is false → no overlap.

### 2.5 Same-Day Booking
**Not allowed.** The minimum advance is 1 full day. If today is July 2, the earliest allowed check-in is July 3 at noon. Implemented in `getEarliestCheckInDate()`.

---

## Section 3: Payment / Receipt Rules

### 3.1 The 2-Hour Hold
- When a booking is created, `expiresAt = now + 2 hours`.
- During this window, the employee must upload a payment receipt.
- If the receipt IS uploaded before expiry → the hold is permanently lifted. The booking remains `pending_payment` but is no longer at risk of expiry.
- If the receipt is NOT uploaded before expiry → `expireStaleBookings()` marks it `expired` on next trigger.

### 3.2 Receipt Upload
- Endpoint: `POST /api/payments` (multipart form)
- Required fields: `bookingId`, `amount`, `receipt` (file)
- `amount` must match `booking.totalPrice` exactly. No partial payments.
- File constraints: JPEG / PNG / WEBP, max 2MB. Extension must match MIME type.
- File is saved to `/uploads/receipts/<uuid>.<ext>` (within persistent storage).
- A `Payment` record is created with `status = "pending"`.
- The booking stays at `status = "pending_payment"` — it does NOT move to another status automatically. The admin must take action.

### 3.3 After Receipt Upload
**THE MOST IMPORTANT RULE:** Once a receipt is uploaded (i.e., `booking.payment != null`), the booking **CANNOT expire**, regardless of how much time has passed. There is no time limit for admin review. The `expiresAt` field becomes irrelevant once a payment record exists.

This is enforced in:
- `lib/booking-lifecycle.ts → expireStaleBookings()`: the `payment: { is: null }` WHERE clause ensures only receipt-free bookings expire.
- `lib/booking-utils.ts → isBookingExpired()`: returns `false` immediately if `booking.payment` or `booking.hasPayment` is truthy.

**NEVER simplify or remove these guards.**

### 3.4 Admin Review — No Time Limit
The admin can take as long as needed to review a receipt. There is no auto-approval, no deadline, and no reminder system. The receipt stays in `pending` state until the admin acts.

### 3.5 Admin Approve
- `payment.status` → `approved`
- `booking.status` → `approved`
- Dates are permanently reserved.
- Cooldown period begins for this employee (see Section 4).
- Employee can now see the villa's contact phone number.

### 3.6 Admin Reject
- `payment.status` → `rejected`
- `booking.status` → `rejected`
- Dates are freed immediately.
- **No cooldown applies.** The employee can book again immediately.
- The receipt file remains on disk — it is never deleted.

### 3.7 Admin Reject Without Receipt
Admin can also reject a `pending_payment` booking that has no receipt yet. This is done via a separate "Reject Booking" form in the admin panel (`lib/admin-booking-actions.ts`). Booking moves to `rejected` directly, no payment record involved.

---

## Section 4: Cooldown Rules

### 4.1 Cooldown Period
- **10 days** (`COOLDOWN_DAYS = 10`).
- Starts from the **check-out time of the last approved booking** (noon on `endDate`).
- During the cooldown, the employee cannot create a new booking.

### 4.2 Cooldown Applies ONLY After Approved Bookings
- If a booking is rejected or expires, no cooldown applies.
- Cooldown is based on `booking.findFirst({ where: { userId, status: "approved" }, orderBy: { endDate: "desc" } })`.
- So only the most recent approved booking's checkout date matters.

### 4.3 Cooldown Example
- Employee A has an approved booking: June 10–12 (checkout June 12 noon).
- Cooldown ends: June 22 noon (10 days after June 12 noon).
- Employee A cannot start a new booking before June 22 noon.
- If Employee A tries to book July 1–3 while cooldown is active, they get: "پس از پایان آخرین رزرو تاییدشده، ۱۰ روز کامل باید بگذرد تا رزرو بعدی مجاز شود."

### 4.4 Cooldown Check Timing
The cooldown is checked at booking creation time (`createBookingHold`), not at date selection time. The calendar does not visually indicate the user's cooldown status — the error only appears when they try to submit.

---

## Section 5: Date and Time Rules

### 5.1 Check-In and Check-Out Time
- Check-in: **12:00 noon (local time)** on `startDate`.
- Check-out: **12:00 noon (local time)** on `endDate`.
- All time calculations use these noon anchors. Constants: `CHECK_IN_HOUR = 12`, `CHECK_OUT_HOUR = 12`.

### 5.2 Maximum Stay
- **3 days maximum** (`MAX_STAY_DAYS = 3`).
- Measured as the number of nights between check-in and check-out.
- Example: June 10 to June 13 = 3 days. Allowed.
- Example: June 10 to June 14 = 4 days. Rejected.

### 5.3 Minimum Advance Booking
- **1 day minimum advance** (`MIN_ADVANCE_DAYS = 1`).
- Same-day booking is not allowed.
- "1 day advance" means the check-in date (noon) must be at least 1 calendar day after the current moment.
- Implemented in `getEarliestCheckInDate()`: adds `MIN_ADVANCE_DAYS` days to now and sets time to noon.

### 5.4 Calendar Display
- The calendar uses the **Jalali (Persian solar) calendar** for display.
- All dates stored in the database are UTC DateTime.
- Conversion to Jalali is done in `lib/utils.ts → toJalaliDate()`.

---

## Section 6: Property Rules

### 6.1 Single Property
There is exactly one villa. The system is designed for one property only. `getSingleProperty()` in `lib/property.ts` returns the canonical property using a priority search:
1. First: property with title containing "مازندران" or "نگین"
2. Fallback: property with non-empty images
3. Last resort: oldest property

### 6.2 Property Status
- `available`: Employees can book dates (subject to existing reservations and cooldown).
- `unavailable`: No new bookings possible. Admin can toggle this to pause all reservations.

### 6.3 Contact Phone Visibility
- The villa's `contactPhone` field is shown to employees **only after their booking is `approved`**.
- Before approval, employees see: "شماره تماس پس از تایید رزرو نمایش داده می‌شود"
- This is a deliberate privacy/operational rule.

---

## Section 7: Admin Permissions

The admin can:
- View all bookings (all employees)
- View all payment receipts
- Approve or reject payments (which approves/rejects the linked booking)
- Reject bookings that have no receipt yet
- Update the payment card number shown to employees
- Update the payment instructions text
- (Future) Edit property content

The admin cannot:
- Create bookings
- Delete users
- Delete receipts
- Access the employee booking flow

---

## Section 8: Employee Permissions

The employee can:
- Log in with their assigned phone + password
- View the single property
- Pick dates and create a booking hold
- Upload a payment receipt within the 2-hour window
- View their own bookings (not other employees' bookings)
- See the villa contact phone after their booking is approved

The employee cannot:
- Access the admin dashboard
- See other employees' bookings
- Register a new account
- Change their own password (no self-service password change feature)
- Cancel their own booking

---

## Section 9: Edge Cases

### Edge Case 1: Two employees try to book the same dates simultaneously
- Both requests run `createBookingHold` inside a transaction.
- The first transaction to commit creates the booking and holds the dates.
- The second transaction sees the overlapping booking and throws "این بازه در حال حاضر رزرو شده یا به‌صورت موقت رزرو است".
- The database transaction isolation prevents race conditions.

### Edge Case 2: Admin tries to approve a booking whose 2-hour hold already expired (before receipt upload)
- The `isBookingExpired({ ...payment.booking, payment })` check is called.
- Since `payment` is not null, `isBookingExpired` returns `false` immediately.
- The approval proceeds normally. This is the correct behavior — once receipt is uploaded, the timer is irrelevant.

### Edge Case 3: Employee uploads receipt at the exact moment the timer expires
- `expireStaleBookings()` is called inside the payment upload transaction.
- It only expires bookings where `payment IS NULL`.
- If the receipt upload completes first (payment record created), the booking cannot be expired.
- If the expiry runs first in another concurrent request, the booking status changes to `expired` before the upload transaction reads it, and the upload fails with "مهلت پرداخت این رزرو به پایان رسیده است".

### Edge Case 4: Admin rejects a booking — can the employee book the same dates again?
- Yes. Rejection sets `booking.status = rejected`, which is not a blocking status.
- The dates become available immediately.
- No cooldown applies.
- The employee can create a new booking for the same dates right away.

### Edge Case 5: Employee's cooldown is still active when they try to book far-future dates
- The cooldown check uses the check-in time of the NEW booking, not the current date.
- If the cooldown ends July 22 and the employee tries to book August 1, it is allowed.
- The cooldown only blocks if the NEW booking's check-in is before the cooldown end date.

### Edge Case 6: More than one property in the database
- `getSingleProperty()` uses a priority algorithm and returns exactly one.
- The bootstrap script warns if there are multiple properties.
- The system is not designed for multi-property operation — do not add more properties.
