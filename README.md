## دیار — سامانه رزرو داخلی ویلا

سامانه رزرو ویلای سازمانی با Next.js، Prisma و PostgreSQL (RTL / فارسی).

### قابلیت‌ها
- ورود کارمندان و یک ادمین (ثبت‌نام عمومی غیرفعال است)
- یک ویلا — رزرو با تقویم جلالی، مهلت پرداخت ۲ ساعت
- بارگذاری رسید و تایید/رد توسط ادمین
- فایل‌ها در `public/uploads/`

### اجرای محلی

```bash
npm install
cp .env.example .env
docker compose up -d   # PostgreSQL
npm run prisma:migrate
npm run prisma:seed    # فقط محیط توسعه — هرگز در production
npm run dev
```

باز کردن: http://localhost:3000

ورود توسعه (پس از `prisma:seed`): شماره تماس `09120000000` (ادمین) یا `09121111111` (کارمند) — رمز `12345678`

### استقرار production

راهنمای کامل: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

- Droplet + SSH + PM2 + Nginx
- `scripts/production-bootstrap.ts` برای دیتابیس تازه (نه `prisma:seed`)
- `scripts/deploy.sh` برای به‌روزرسانی

**هرگز** فایل `LOGIN_CREDENTIALS.md` یا گزارش‌های `*_REPORT.md` را روی سرور production قرار ندهید.
