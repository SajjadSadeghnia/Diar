# Diar / دیار — Project Master Context

> **For AI assistants:** This document is the primary entry point. Read this first, then read every other file in `docs/ai/`. Together they give you complete project context to act as technical lead without needing to re-examine the source code from scratch every session.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Name** | Diar / دیار |
| **Type** | Private internal web application |
| **Language** | Farsi (RTL) |
| **Purpose** | Villa booking system exclusively for company employees |
| **Status** | Live in production (as of 2026-07) |
| **GitHub** | https://github.com/SajjadSadeghnia/Diar |
| **Production URL** | http://165.245.245.149 (HTTP only — SSL pending) |

---

## 2. Purpose in One Paragraph

Diar is a closed, invite-only villa booking system. The company owns one villa (in the Nogin Nour complex, city of Nour, Mazandaran province). Employees can log in, view the villa, pick stay dates, submit a payment receipt, and wait for admin approval. There is one admin who reviews receipts and approves or rejects reservations. No public registration, no email, no external payment gateway — the entire flow is internal.

---

## 3. Architecture Overview

```
Browser (RTL / Farsi)
    │
    ▼
Nginx (reverse proxy, port 80 → 3000)
    │
    ▼
PM2 → Next.js 16.2.4 (Node 20, port 3000)
    │
    ├── App Router (app/)
    │     ├── Pages (RSC + client components)
    │     └── API Routes (route.ts files)
    │
    ├── lib/          — shared business logic
    ├── components/   — reusable UI components
    ├── prisma/       — ORM + migrations
    └── scripts/      — one-time + operational scripts
    │
    ▼
PostgreSQL 16 (local, localhost:5432, DB: property_agah)
    │
    ▼
File system: /var/www/diar/uploads/ (symlinked to public/uploads/)
```

---

## 4. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.2.4 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | ^5 |
| ORM | Prisma | ^6.19.3 |
| Database | PostgreSQL | 16 (local on VPS) |
| Auth | JWT via `jsonwebtoken` | ^9.0.3 |
| Password hashing | bcryptjs | ^3.0.3 |
| Validation | Zod | ^4.3.6 |
| Forms | react-hook-form | ^7.74.0 |
| Date picker | react-multi-date-picker | ^4.5.2 |
| Calendar | Jalali (Persian solar) via react-date-object | ^2.1.9 |
| Styling | Tailwind CSS | ^4 |
| Icons | lucide-react | ^1.14.0 |
| Process manager | PM2 | latest |
| Web server | Nginx | latest |
| Hosting | DigitalOcean Droplet | Ubuntu 24.04, 2GB RAM |

> **IMPORTANT:** Next.js 16.2.4 may have breaking changes from versions before 15. AGENTS.md (project root) warns: "This is NOT the Next.js you know. APIs, conventions, and file structure may differ from training data." Always read `node_modules/next/dist/docs/` for the version-specific API before writing code.

---

## 5. Users and Roles

### Admin (role: `admin`)
- One admin exists in the system.
- Logs in with a phone number + password.
- Can view all bookings and payments.
- Can approve or reject payment receipts.
- Can update payment card number and instructions.
- Is redirected to `/admin` on login; cannot see employee homepage.
- Cannot make bookings.

### Employee (role: `employee`)
- 92 employees currently imported.
- Each has a phone number + password assigned by the company.
- Can view the villa, pick dates, create a booking, upload receipt.
- Can see only their own bookings.
- Cannot access `/admin` in any way.
- Cannot self-register — accounts are imported via CSV.

---

## 6. Core Business Flows

### Flow A: Employee Books the Villa
```
1. Employee logs in with phone + password
2. Views homepage → clicks "View Villa"
3. Selects check-in and check-out dates (Jalali calendar)
4. Clicks "Continue and Pay" → API creates a booking (status: pending_payment)
5. A 2-hour expiry timer starts (expiresAt = now + 2h)
6. Employee is redirected to /payment/[bookingId]
7. Employee sees card number and instructions
8. Employee uploads payment receipt (image: JPG/PNG/WEBP, max 2MB)
9. Receipt is saved to /var/www/diar/uploads/receipts/
10. Payment record created → booking remains pending_payment but timer stops
11. Employee sees "Receipt submitted, awaiting admin review"
```

### Flow B: Admin Reviews a Payment
```
1. Admin sees pending payment in /admin dashboard
2. Admin views receipt image inline
3. Admin clicks "Approve" → booking.status = approved, payment.status = approved
   - Dates are permanently reserved (cooldown clock starts for that employee)
4. OR Admin clicks "Reject" → booking.status = rejected, payment.status = rejected
   - Dates are freed immediately, no cooldown
5. Employee sees updated status in /bookings
6. If approved: employee can see the villa's contact phone number
```

### Flow C: Booking Expiry (No Receipt)
```
1. Employee creates booking (timer: 2 hours)
2. Employee does NOT upload receipt within 2 hours
3. On next API call that runs expireStaleBookings():
   - booking.status = expired
   - Dates are freed
4. Employee sees "Expired" status in /bookings
5. Employee can create a new booking for the same dates
```

---

## 7. Important Folder Structure

```
/app/                        ← Next.js app router pages and API routes
  /admin/                    ← Admin dashboard (protected)
  /bookings/                 ← Employee booking list
  /dashboard/                ← Employee dashboard
  /login/                    ← Login page (public)
  /payment/[bookingId]/      ← Receipt upload
  /properties/[id]/          ← Villa detail + date picker
  /api/
    /auth/login/             ← POST: phone+password → JWT cookie
    /bookings/               ← GET (list) + POST (create hold)
    /bookings/[id]/          ← GET (single booking)
    /payments/               ← GET (admin list) + POST (upload receipt)
    /payments/[id]/review/   ← PATCH (admin approve/reject)
    /properties/             ← GET (list) + single property
    /properties/[id]/availability/ ← GET (calendar state)
    /settings/               ← GET (card/instructions) + PUT (admin update)

/lib/                        ← Shared business logic
  auth.ts                    ← JWT sign/verify, cookie helpers
  booking-lifecycle.ts       ← expireStaleBookings, createBookingHold, fetchBlockingBookings
  booking-utils.ts           ← All constants, validators, helpers (pure functions)
  phone.ts                   ← Iranian phone validation/normalization
  prisma.ts                  ← Prisma client singleton
  property.ts                ← getSingleProperty() helper
  property-details.ts        ← Villa metadata, images list, parsing helpers
  upload.ts                  ← File save logic (MIME validation, UUID naming)
  utils.ts                   ← toJalaliDate, toToman, calcDays

/components/                 ← Reusable UI
  status-badge.tsx           ← Booking/payment status pill
  property-gallery.tsx       ← Image carousel
  booking-payment-status.tsx ← Timer + upload button for employee
  employee-info.tsx          ← Name + phone display (admin views)
  admin-payment-settings-modal.tsx ← Card/instructions editor
  property-info-sections.tsx ← Amenity details display

/prisma/
  schema.prisma              ← Database schema (5 models)
  migrations/                ← All migration history
  seed.ts                    ← DEV ONLY — never run on production

/scripts/
  production-bootstrap.ts    ← One-time: create admin + property + settings
  import-employees.ts        ← Bulk CSV employee import
  deploy.sh                  ← VPS update script (git pull → build → pm2 restart)
  server-setup.sh            ← One-time VPS OS setup
  backup.sh                  ← DB + uploads backup
  sync-property-content.ts   ← Update property metadata only (safe)

/proxy.ts                    ← Auth/routing middleware (SEE KNOWN RISKS)
/ecosystem.config.cjs        ← PM2 process definition
/nginx.diar.conf.example     ← Nginx config template
```

---

## 8. Database Schema Summary

### Models

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `User` | id, name, phone (unique), password, role | Employees and admin |
| `Property` | id, title, dailyPrice, images[], status | The one villa |
| `Booking` | id, userId, propertyId, startDate, endDate, totalPrice, status, expiresAt | Reservation records |
| `Payment` | id, bookingId (unique), receiptPath, amount, status | Receipt records |
| `SystemSetting` | id=1, cardNumber, instructions | Payment card info (singleton) |

### Enums

- `Role`: `admin` | `employee`
- `BookingStatus`: `pending_payment` | `approved` | `rejected` | `expired`
- `PaymentStatus`: `pending` | `approved` | `rejected`
- `PropertyStatus`: `available` | `unavailable`

---

## 9. Authentication

- **Mechanism:** Phone number + password → bcryptjs verify → JWT signed with `JWT_SECRET`
- **Token:** Stored as `httpOnly` cookie named `token`, 7-day expiry
- **Cookie security:** `secure: true` + `sameSite: "none"` on HTTPS; `secure: false` + `sameSite: "lax"` on HTTP
- **No email login.** This constraint is permanent and business-critical.
- **No self-registration.** Accounts created by admin via import script or bootstrap.

---

## 10. Production Status (as of 2026-07-02)

| Item | Status |
|------|--------|
| Server | Live — DigitalOcean Droplet, IP: 165.245.245.149 |
| App | Running via PM2 (app name: `diar`) |
| HTTP access | Working |
| HTTPS/SSL | **Not configured** — domain not connected yet |
| Database | PostgreSQL running, data present |
| Admin | 1 admin account exists |
| Employees | 92 employees imported |
| Property | 1 villa configured (Nogin Nour, Nour city) |
| GitHub Actions auto-deploy | Not yet confirmed working |
| Backups | No scheduled backup cron yet |

---

## 11. Known Risks (from audit 2026-07-02)

### HIGH: middleware.ts is missing
`proxy.ts` contains routing/auth middleware logic, but Next.js expects the file to be named `middleware.ts` with a `middleware` named export or default export. The `proxy` function in `proxy.ts` is not automatically picked up by Next.js. **Page-level auth guards may not be running.** API routes still verify auth internally, but direct page access may be unprotected. This must be tested on production.

### HIGH: LOGIN_CREDENTIALS.md is in the repository
This file contains sensitive credential information and was committed to Git. `deploy.sh` runs `git pull`, which means it may already be on the production server at `/var/www/diar/app/LOGIN_CREDENTIALS.md`. Must be confirmed and removed.

### MEDIUM: No HTTPS yet
Login credentials (phone + password) are transmitted in plaintext. The JWT cookie cannot be `sameSite: "none"; secure: true` without HTTPS. This is in progress.

### MEDIUM: No login rate limiting
`/api/auth/login` has no brute-force protection. With 92 known phone-number-format accounts, this is a potential attack surface.

### LOW: 13+ `*_REPORT.md` files in repo root
These are deployed to the server via `git pull`. They contain system information and debugging notes. Not a credential risk but unnecessary exposure.

---

## 12. Future Plans

- Connect custom domain
- Configure SSL via Certbot
- Confirm GitHub Actions auto-deploy pipeline
- Set up nightly backup cron
- Import remaining employees if any
- Update property content (images, description) as needed
- Consider rate limiting on login endpoint
- Clean up report files from repository
