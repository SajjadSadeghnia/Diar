# Diar / دیار — Glossary

This glossary defines all terms, Persian words, entities, statuses, and system-specific concepts used in the Diar project.

---

## Persian Project Terms

| Persian | Transliteration | Meaning in Context |
|---------|----------------|---------------------|
| دیار | Diyar | "Homeland / Homeland" — the app's name |
| ویلا | Villa | The single company villa |
| رزرو | Rezerv | Reservation / Booking |
| کارمند | Karmand | Employee |
| ادمین | Admin | Administrator |
| رسید | Rasid | Receipt (payment proof) |
| فیش | Fish | Colloquial for receipt/bank slip |
| واریز | Variz | Bank transfer / payment deposit |
| پرداخت | Pardakht | Payment |
| تأییدیه | Taeidiyeh | Confirmation / Approval |
| رد | Rad | Rejection |
| منقضی | Monqazi | Expired |
| مهلت | Mohlat | Deadline / Time limit |
| خروج | Khoruj | Check-out / Exit |
| ورود | Vorud | Check-in / Entry |
| تقویم | Taqvim | Calendar |
| تقویم جلالی | Taqvim-e Jalali | Persian solar calendar |
| کارت بانکی | Kart-e Banki | Bank card number |
| شماره کارت | Shomareh Kart | Card number |
| شماره تماس | Shomareh Tamas | Phone number / Contact number |
| مجتمع | Mojtama | Complex / Compound (residential) |
| ویلای سازمانی | Vilay-e Sazamani | Organizational / Company villa |
| داشبورد | Dashboard | Dashboard |
| کاربر | Karbor | User |
| نقش | Naqs | Role |
| بارگذاری | Bargozari | Upload |
| دانلود | Download | Download (borrowed word) |
| مازندران | Mazandaran | A province in northern Iran |
| نور | Nour | City name (where the villa is) |
| نگین نور | Nagin-e Nour | "Jewel of Nour" — the residential complex name |

---

## Business Terms

| Term | Definition |
|------|-----------|
| Booking Hold | A temporary reservation created when employee picks dates. Lasts 2 hours unless a receipt is uploaded. |
| Cooldown Period | 10-day waiting period after an approved booking's checkout before the same employee can book again. |
| Admin Review | The period after receipt upload during which the admin decides to approve or reject. No time limit. |
| Blocking Booking | A booking that prevents other employees from picking the same dates. Both `approved` and valid `pending_payment` bookings are blocking. |
| Stale Hold | A `pending_payment` booking with no receipt where `expiresAt < now`. Not blocking — can be expired. |
| Bootstrap | The one-time script (`production-bootstrap.ts`) that creates the admin account, payment settings, and property on a fresh production database. |
| Symlink | The symbolic link at `public/uploads → /var/www/diar/uploads`. Allows Next.js to serve uploaded files while keeping them outside the Git repo. |
| Deploy | The process of updating production code: `git pull` → build → PM2 restart. Defined in `scripts/deploy.sh`. |
| Migration | A versioned SQL change to the database schema, managed by Prisma. Production uses `migrate deploy`, never `migrate dev`. |

---

## Database Entities

### User
Represents both employees and the admin. Key fields:
- `id` — CUID string, primary key
- `phone` — unique, format `09XXXXXXXXX`
- `password` — bcrypt hash
- `role` — `admin` or `employee`

### Property
The company villa. There is exactly one in production. Key fields:
- `title` — villa name
- `dailyPrice` — price per night in Iranian Rials (Toman × 10)
- `images[]` — array of image paths (strings like `/uploads/properties/ganje-01.png`)
- `status` — `available` or `unavailable`
- `detailsJson` — structured JSON with amenities, sea distance, etc.

### Booking
A reservation record. Key fields:
- `userId` — which employee
- `propertyId` — which property (always the one property)
- `startDate` — check-in date (DateTime, noon UTC)
- `endDate` — check-out date (DateTime, noon UTC)
- `totalPrice` — days × dailyPrice
- `status` — see Booking Statuses below
- `expiresAt` — when the 2h hold expires (null after receipt uploaded has no effect; the guard is in code)

### Payment
A receipt upload record. One per booking, created when employee uploads receipt. Key fields:
- `bookingId` — which booking (unique — one payment per booking)
- `receiptPath` — file path like `/uploads/receipts/<uuid>.jpg`
- `amount` — must match booking.totalPrice
- `status` — see Payment Statuses below

### SystemSetting
Singleton record (id=1). Stores:
- `cardNumber` — bank card number shown to employees
- `instructions` — payment instruction text shown to employees

---

## Booking Statuses

| Status | Persian | Meaning |
|--------|---------|---------|
| `pending_payment` | در انتظار پرداخت | Booking created, waiting for receipt upload OR waiting for admin review after receipt upload |
| `approved` | تأیید شده | Admin approved the receipt. Dates are permanently reserved. Employee can see contact phone. |
| `rejected` | رد شده | Admin rejected. OR admin rejected without receipt. Dates are freed. No cooldown. |
| `expired` | منقضی | 2h timer ran out with no receipt uploaded. Dates freed. |

Note: The `pending_payment` status covers two sub-states (before receipt and after receipt). Use `getBookingDisplayStatus()` to distinguish them in the UI:
- `pending_payment` + no payment = show payment countdown
- `pending_payment` + has payment = display as `awaiting_admin_review`

---

## Payment Statuses

| Status | Persian | Meaning |
|--------|---------|---------|
| `pending` | در انتظار | Receipt uploaded, admin has not reviewed yet |
| `approved` | تأیید شده | Admin approved the payment |
| `rejected` | رد شده | Admin rejected the payment |

---

## Folder Names

| Folder | Purpose |
|--------|---------|
| `app/` | Next.js App Router — pages and API routes |
| `app/admin/` | Admin-only pages |
| `app/api/` | REST API endpoints |
| `lib/` | Shared TypeScript business logic |
| `components/` | Reusable React UI components |
| `prisma/` | Database schema and migrations |
| `prisma/migrations/` | Version-controlled migration SQL files |
| `scripts/` | Operational scripts (deploy, import, backup) |
| `public/` | Statically served files |
| `public/uploads/` | Symlink → `/var/www/diar/uploads/` |
| `docs/ai/` | AI context package (this folder) |

---

## Scripts Reference

| Script | Type | Purpose | When to Run |
|--------|------|---------|------------|
| `scripts/server-setup.sh` | Bash | Installs OS dependencies (Node, PM2, Nginx, etc.) | Once, on a new VPS |
| `scripts/deploy.sh` | Bash | Updates production code | Every release |
| `scripts/production-bootstrap.ts` | TypeScript | Creates admin, property, settings in empty DB | Once after first deploy |
| `scripts/import-employees.ts` | TypeScript | Imports employees from CSV | When adding new employees |
| `scripts/backup.sh` | Bash | Backs up DB and uploads | Automated cron or manual |
| `scripts/sync-property-content.ts` | TypeScript | Updates property metadata only (safe) | When updating villa info |
| `prisma/seed.ts` | TypeScript | Creates test data | **DEV ONLY — never production** |

---

## Server Terminology

| Term | Definition |
|------|-----------|
| Droplet | DigitalOcean's name for a VPS (Virtual Private Server) |
| PM2 | Process Manager 2 — keeps the Node.js app running, restarts on crash, survives reboots |
| Nginx | Web server used as a reverse proxy — receives HTTP requests and forwards to Node.js on port 3000 |
| UFW | Uncomplicated Firewall — Ubuntu's firewall. Only SSH (22) and Nginx (80, 443) are open |
| Certbot | Tool from Let's Encrypt for free SSL certificates. Auto-renews every 90 days |
| SSH | Secure Shell — how the owner and GitHub Actions connect to the server |
| `pg_dump` / `pg_restore` | PostgreSQL backup and restore commands |
| CUID | Collision-resistant Unique Identifier — used as primary keys in Prisma models |
| JWT | JSON Web Token — the auth token stored in the `token` cookie |
| bcrypt | Password hashing algorithm with salt rounds (10 rounds used in this project) |

---

## Environment Names

| Name | Meaning |
|------|---------|
| `development` | Local machine, `npm run dev`, SQLite or local Postgres, seed data OK |
| `production` | DigitalOcean server, `npm run build` + `npm start` via PM2, real employee data |
| `NODE_ENV=production` | Enables strict mode in Next.js, forces `JWT_SECRET` requirement |

---

## Key API Endpoints

| Endpoint | Method | Role Required | Purpose |
|----------|--------|--------------|---------|
| `/api/auth/login` | POST | None | Login |
| `/api/auth/logout` | POST | Any | Logout |
| `/api/bookings` | GET | Any auth | List bookings (admin: all, employee: own) |
| `/api/bookings` | POST | Employee | Create booking hold |
| `/api/bookings/[id]` | GET | Any auth | Get single booking |
| `/api/payments` | GET | Admin | List payments |
| `/api/payments` | POST | Employee | Upload receipt |
| `/api/payments/[id]/review` | PATCH | Admin | Approve/reject payment |
| `/api/properties` | GET | Any auth | List properties (returns the one property) |
| `/api/properties/[id]` | GET | Any auth | Get property details |
| `/api/properties/[id]/availability` | GET | Any auth | Get calendar state |
| `/api/settings` | GET | Any auth | Get payment card info |
| `/api/settings` | PUT | Admin | Update payment card info |
