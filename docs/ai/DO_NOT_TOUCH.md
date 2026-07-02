# Diar / دیار — DO NOT TOUCH

> **This is a hard-stop safety document.** Before running any command or modifying any file listed here, you MUST get explicit confirmation from the project owner. "It seems safe" is not sufficient. "The user asked me to" is not sufficient unless the owner has specifically acknowledged the production risk.

---

## SECTION A: COMMANDS THAT MUST NEVER RUN ON PRODUCTION

These commands will **destroy production data or break the live system.** They are listed here so no AI assistant, script, or well-meaning human accidentally runs them.

### Database Destruction
```bash
# NEVER run these on the production server:
npx prisma migrate reset        # Wipes the entire database
npx prisma db push              # Bypasses migrations, can drop columns
npx prisma db seed              # Inserts dev test data, may conflict with real data
npm run prisma:seed             # Same as above
npx tsx prisma/seed.ts          # Same as above

# NEVER run these SQL commands:
DROP DATABASE property_agah;
DELETE FROM "User";
DELETE FROM "Booking";
DELETE FROM "Payment";
DELETE FROM "Property";
DELETE FROM "SystemSetting";
TRUNCATE TABLE "User" CASCADE;
```

### File System Destruction
```bash
# NEVER run these:
rm -rf public/uploads           # Deletes all property images and receipts
rm -rf /var/www/diar/uploads    # Deletes ALL persistent uploads
rm -rf /var/www/diar/app        # Deletes the entire application
```

### Service Disruption
```bash
# Do not run without owner's SSH session open and ready to recover:
pm2 delete diar                 # Stops the app permanently (use pm2 restart instead)
sudo systemctl stop postgresql  # Takes down the database
sudo systemctl stop nginx       # Takes down the web server
```

### Deploy Commands
```bash
# These touch production and must only run after owner approval:
bash scripts/deploy.sh          # Production update (safe, but owner must authorize)
pm2 restart diar                # Causes brief downtime
sudo systemctl reload nginx     # Brief interruption
sudo certbot --nginx ...        # SSL setup (major config change)
```

---

## SECTION B: CODE THAT MUST NEVER BE CHANGED WITHOUT EXPLICIT APPROVAL

### B.1 Receipt Expiry Guard — THE MOST CRITICAL GUARD

**File:** `lib/booking-lifecycle.ts`  
**Function:** `expireStaleBookings()`

```typescript
// THIS WHERE CLAUSE IS LOAD-BEARING — DO NOT SIMPLIFY
where: {
  status: "pending_payment",
  expiresAt: { lt: now },
  payment: { is: null },   // ← NEVER REMOVE THIS LINE
},
```

**Why:** The `payment: { is: null }` clause prevents bookings with uploaded receipts from ever expiring. If this line is removed, the system will expire bookings that have receipts — destroying confirmed payments and causing double-booking of dates.

---

**File:** `lib/booking-utils.ts`  
**Function:** `isBookingExpired()`

```typescript
// THESE EARLY RETURNS ARE LOAD-BEARING — DO NOT REMOVE
if (booking.status !== "pending_payment") return false;
if (booking.hasPayment || booking.payment) return false;  // ← NEVER REMOVE
if (!booking.expiresAt) return true;
return booking.expiresAt <= now;
```

**Why:** Same guard. Once a receipt is uploaded (`hasPayment` or `payment` is truthy), the booking can never expire. Removing this breaks the fundamental promise to employees that their receipt submission secures their booking.

---

### B.2 Phone-Only Authentication

**File:** `app/api/auth/login/route.ts`  
**File:** `lib/auth.ts`

**Rules:**
- Do not add email login.
- Do not change the `phone` field to `email` in the User model.
- Do not add a `username` field as an alternative.
- The login schema validates only `phone` and `password`.

**Why:** The entire employee database uses phone numbers as identifiers. The 92 imported employees have no email addresses in the system. Changing this would require a data migration and operational coordination with all employees.

---

### B.3 Cooldown Logic

**File:** `lib/booking-utils.ts`  
**Functions:** `validateCooldown()`, `getCooldownEndsAt()`  
**Constants:** `COOLDOWN_DAYS = 10`

Do not change `COOLDOWN_DAYS` without owner approval. Do not modify the cooldown calculation to use `createdAt` instead of `endDate`. The cooldown starts from the checkout time (noon on `endDate`) of the last **approved** booking.

---

### B.4 Single-Property Architecture

**File:** `lib/property.ts`  
**Function:** `getSingleProperty()`

Do not convert this to a multi-property function. Do not add property selection UI. The entire system is designed for one property. If multi-property support is ever added, it requires a major architecture review, not a quick change.

---

### B.5 Middleware Authentication

**File:** `proxy.ts` (or future `middleware.ts`)

Do not disable authentication checks. Do not add routes to the `publicRoutes` array without thinking through the security implications. The public routes list should only ever be `/login`.

---

### B.6 Upload Storage Path

**File:** `lib/upload.ts`  
**Key line:**
```typescript
const fullPath = path.join(process.cwd(), "public", relativePath);
```

Do not change this to a different storage location without:
1. Updating the nginx config (to serve from the new path)
2. Migrating existing files
3. Updating the symlink

**Why:** Property images and payment receipts are served at `/uploads/...` by Nginx aliasing `/var/www/diar/uploads/`. If the file save path changes, new uploads break.

---

## SECTION C: SENSITIVE FILES

| File | Why Sensitive | What to Never Do |
|------|--------------|-----------------|
| `/var/www/diar/app/.env` | Production secrets | Never commit to Git, never log contents, never expose in error messages |
| `prisma/schema.prisma` | Database structure | Never modify without a migration plan |
| `prisma/migrations/` | Migration history | Never delete or modify existing migration files |
| `ecosystem.config.cjs` | PM2 config | Never change the app name (`diar`) without updating all scripts |
| `scripts/deploy.sh` | Production deploy | Never add seed or reset commands to this script |
| `LOGIN_CREDENTIALS.md` | Contains credentials | Must NOT be on production server — verify and remove if present |
| `scripts/production-bootstrap.ts` | Admin creation | Never run on a populated production DB without verifying idempotency |

---

## SECTION D: NEVER DELETE RECEIPTS

Payment receipt images at `/var/www/diar/uploads/receipts/` must **never be deleted**, even after a booking is rejected. Reasons:

1. **Audit trail:** The admin may need to reference a rejected receipt later.
2. **Legal:** Proof of payment attempt.
3. **DB references:** `Payment.receiptPath` points to the file. If the file is deleted, the admin panel shows a broken image.

To "clean up" old receipts would require:
1. A policy decision by the owner
2. A coordinated migration that updates DB records
3. Never deleting receipts for `approved` bookings

---

## SECTION E: NEVER CHANGE THESE BUSINESS CONSTANTS WITHOUT DISCUSSION

| Constant | File | Current Value | Risk if Changed |
|----------|------|--------------|-----------------|
| `PAYMENT_HOLD_HOURS` | `lib/booking-utils.ts` | `2` | Employees have less/more time to pay |
| `MAX_STAY_DAYS` | `lib/booking-utils.ts` | `3` | Allows longer stays, blocks calendar longer |
| `MIN_ADVANCE_DAYS` | `lib/booking-utils.ts` | `1` | Allows same-day booking |
| `COOLDOWN_DAYS` | `lib/booking-utils.ts` | `10` | Employees can book more/less frequently |
| `CHECK_IN_HOUR` | `lib/booking-utils.ts` | `12` | All booking time calculations break |
| `CHECK_OUT_HOUR` | `lib/booking-utils.ts` | `12` | All checkout time calculations break |
| Max file size | `lib/upload.ts` | `2MB` | Server disk usage, memory usage |

These are business decisions, not technical ones. Any change requires owner sign-off.

---

## SECTION F: ROLLBACK CHECKLIST

If something goes wrong after a deploy, the rollback plan is:

### Application Rollback (code only)
```bash
ssh deploy@165.245.245.149
cd /var/www/diar/app
git log --oneline -10          # Find the last good commit hash
git checkout <GOOD_COMMIT>     # Switch to that commit
npm run build
pm2 restart diar
```

### Database Rollback
Only possible if a backup exists:
```bash
pg_restore -d property_agah --clean --if-exists backups/YYYY-MM-DD-HH-mm/database.dump
```
**WARNING:** `--clean` drops and recreates all objects. Use only when you intend to fully replace the DB state.

### If PM2 is down
```bash
pm2 start ecosystem.config.cjs
pm2 save
```

### If Nginx is misconfigured
```bash
sudo nginx -t              # Test config
sudo systemctl reload nginx # Apply only if test passes
```
