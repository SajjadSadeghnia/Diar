# Diar / دیار — Current TODO

Last audited: 2026-07-02  
Status: Production is live. These items are pending.

---

## PRIORITY 1: Security & Infrastructure (Must Do Soon)

### 1.1 Verify Middleware is Active
**Status:** Unconfirmed — HIGH RISK  
**What to do:**
```bash
# Without a cookie, try accessing a protected page:
curl -I http://165.245.245.149/
curl -I http://165.245.245.149/bookings
# Expected: 302 redirect to /login
# If result is 200: middleware is NOT running — fix immediately
```
**Root cause:** `proxy.ts` exports function named `proxy`, not `middleware`. No `middleware.ts` file exists. Standard Next.js requires `middleware.ts` with `middleware` named export. Needs investigation and fix.  
**Who fixes:** Claude Code, guided by Claude Desktop.

---

### 1.2 Remove LOGIN_CREDENTIALS.md from Production Server
**Status:** Unconfirmed — HIGH RISK  
**What to do:**
```bash
ssh deploy@165.245.245.149
ls /var/www/diar/app/LOGIN_CREDENTIALS.md  # If file exists:
rm /var/www/diar/app/LOGIN_CREDENTIALS.md
```
Also consider: removing from Git history or gitignoring it.  
**Who does it:** Owner via SSH.

---

### 1.3 Connect Domain + Install SSL
**Status:** Not started  
**Steps:**
1. Purchase/configure domain (e.g., diar.yourcompany.ir)
2. Set DNS A record → 165.245.245.149
3. Wait for DNS propagation (up to 24h)
4. Update nginx `server_name` to the domain
5. Run: `sudo certbot --nginx -d yourdomain.com`
6. Reload nginx: `sudo systemctl reload nginx`
7. Test HTTPS login
8. Verify cookie security switches to `secure: true`

**Why urgent:** Currently all login credentials are sent over HTTP in plaintext.

---

### 1.4 Set Up Backup Cron
**Status:** Not started  
**Steps:**
```bash
ssh deploy@165.245.245.149
crontab -e
# Add:
0 3 * * * cd /var/www/diar/app && bash scripts/backup.sh >> /var/log/diar-backup.log 2>&1
```
Verify backup runs:
```bash
bash scripts/backup.sh  # Manual test first
ls backups/
```
**Why urgent:** No backups = no recovery from accidental data loss or server failure.

---

### 1.5 Confirm GitHub Actions Auto-Deploy
**Status:** Workflow file exists but not confirmed working  
**Steps:**
1. Verify GitHub Secrets are set: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_PORT`, `DROPLET_SSH_KEY`
2. Make a small test commit (e.g., update a comment) and push to main
3. Watch GitHub Actions tab → should SSH in and run deploy.sh
4. Check PM2 logs after deploy: `pm2 logs diar --lines 50`
**Why needed:** Without auto-deploy, every update requires manual SSH.

---

## PRIORITY 2: Housekeeping (Do Before Active Development)

### 2.1 Remove or Gitignore Report Files
**Status:** 13+ `*_REPORT.md` files in repo root  
**Files to clean up:**
- `BOOKING_SYSTEM_IMPROVEMENTS_REPORT.md`
- `COMPREHENSIVE_LOGIN_DEBUG_REPORT.md`
- `DATABASE_VERIFICATION_REPORT.md`
- `DYNAMIC_COOKIE_FIX_REPORT.md`
- `FINAL_BROWSER_AUTHENTICATION_REPORT.md`
- `FRONTEND_AUTH_FLOW_ANALYSIS_REPORT.md`
- `GANJE_PRIVATE_SYSTEM_REPORT.md`
- `HOME_PAGE_UI_UPDATE_REPORT.md`
- `HTTPS_COOKIE_FIX_REPORT.md`
- `LOGOUT_DEBUG_REPORT.md`
- `NGROK_TUNNEL_SETUP_REPORT.md`
- `PUBLIC_TUNNEL_SETUP_REPORT.md`
- `RUNTIME_ERROR_FIX_REPORT.md`
- `SYSTEM_WIDE_AUDIT_REPORT.md`
- `LOGIN_CREDENTIALS.md`

**Options:**
- Move them to `docs/history/` and add `docs/history/` to `.gitignore`
- Or delete them entirely
- Or keep them in the repo but ensure they're in `.gitignore` so they're not tracked

---

### 2.2 Clean Up Empty Debug API Directories
**Status:** 8 empty directories under `app/api/debug/`  
**What:** `approve-booking`, `browser-auth-test`, `complete-auth-flow`, `complete-browser-flow`, `db-info`, `frontend-auth-state`, `isolate-issues`, `system-audit` — all empty.  
**Action:** Delete the entire `app/api/debug/` directory.  
**Risk:** Zero — no routes exist there.

---

### 2.3 Make GitHub Repository Private (if not already)
**Status:** Unknown  
**Action:** GitHub → Settings → Danger Zone → Change visibility → Private  
**Why:** The repo currently contains sensitive file names and system architecture details.

---

## PRIORITY 3: Feature Improvements (When Ready)

### 3.1 Add Login Rate Limiting
**Status:** Not implemented  
**Problem:** `/api/auth/login` has no brute-force protection.  
**Approach:** Add in-memory rate limiter (e.g., `rate-limiter-flexible` package) or use middleware-level limiting.  
**Effort:** Small (1–2 hours)

---

### 3.2 Employee Password Self-Service
**Status:** Not implemented  
**Problem:** Employees cannot change their own password. If they forget it, the admin must manually update it in the DB.  
**Approach:** Add `/profile` page with password change form (requires current password verification).  
**Effort:** Medium (3–4 hours)

---

### 3.3 Booking Cancellation by Employee
**Status:** Not implemented  
**Problem:** An employee who created a booking cannot cancel it — they can only wait for it to expire or ask admin to reject it.  
**Consideration:** Should cancellation be allowed? Only before receipt upload? Business decision needed.  
**Effort:** Small-Medium (2–3 hours once business rule is decided)

---

### 3.4 Admin Notification for New Receipts
**Status:** Not implemented  
**Problem:** Admin has no way to know when a new receipt is uploaded — must manually refresh the dashboard.  
**Approaches:**
- Email notification (requires SMTP setup)
- SMS notification (requires SMS gateway)
- Telegram bot notification (simplest for Iran)  
**Effort:** Medium (depends on channel chosen)

---

### 3.5 Booking History for Admin (Paginated)
**Status:** Partial — admin sees last 50 payments  
**Problem:** As bookings grow, the admin archive table (`take: 50`) will miss older records.  
**Approach:** Add pagination or date filtering to the archive table.  
**Effort:** Small (2 hours)

---

### 3.6 Employee List Page for Admin
**Status:** Not implemented  
**Problem:** Admin cannot see the list of 92 employees in the UI.  
**Approach:** Add `/admin/employees` page with employee list, search, and optional password reset.  
**Effort:** Medium (3–4 hours)

---

### 3.7 Property Gallery Update
**Status:** Images loaded from `property-details.ts`  
**Problem:** If the owner wants to update villa images, they must edit code. No admin UI for image management.  
**Approach:** Add image upload to the property edit page (`/admin/properties`).  
**Effort:** Medium (4–5 hours)

---

## PRIORITY 4: Long-Term (When Business Grows)

- Multi-property support (requires architectural redesign)
- Booking cancellation policy (with partial refund logic)
- Employee booking history PDF export
- Admin analytics dashboard (bookings per month, revenue)
- Automated reminder to employees with pending payments
- Mobile app (React Native or PWA)
