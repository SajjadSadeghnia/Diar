# دیار — DigitalOcean Droplet Deployment Guide

**Method:** SSH + manual deploy scripts (not App Platform, not auto Git deploy).

**Stack:** Ubuntu VPS · Node 20 · PostgreSQL · PM2 · Nginx · Certbot

---

## Recommended Droplet (buy this)

| Setting | Recommendation |
|---------|----------------|
| **Provider** | DigitalOcean Droplet (not App Platform) |
| **OS** | Ubuntu 24.04 LTS (22.04 also fine) |
| **Size** | **2 GB RAM / 1 vCPU** (~$12/mo) — safer for `npm run build` |
| **Disk** | 50 GB default (plenty for DB + uploads) |
| **Auth** | SSH key only |
| **Region** | Closest stable region for your users |

1 GB RAM can work with swap but builds may fail; **2 GB is the practical minimum**.

After creating the Droplet, follow sections A → L below. Shell scripts should be executable (`chmod +x scripts/*.sh` if needed).

---

## Overview

| Step | What |
|------|------|
| First time | Create Droplet → `server-setup.sh` → clone app → `.env` → DB → migrate → bootstrap → images → symlink uploads → PM2 → Nginx → HTTPS |
| Each update | `git push origin main` → GitHub Actions auto-deploys (or manual SSH fallback) |
| Employees later | `npx tsx scripts/import-employees.ts employees.csv` |
| Backup | `bash scripts/backup.sh` |

---

## A) Create the DigitalOcean Droplet

1. **Create Droplet** — Ubuntu 22.04 or 24.04 LTS.
2. **Size** — **2 GB RAM** / 1 vCPU recommended (see top of this doc).
3. **Region** — closest to users (Iran: consider EU neighbor region if latency matters).
4. **Authentication** — SSH key (recommended), not password-only.
5. **Hostname** — e.g. `diar-prod`.
6. Note the **public IP**.

```bash
ssh root@YOUR_DROPLET_IP
```

Optional: create a non-root deploy user (script can do this):

```bash
export DEPLOY_USER=deploy
sudo bash /path/to/scripts/server-setup.sh
```

---

## B) Install system dependencies

Copy `server-setup.sh` to the server, or clone the repo first then run:

```bash
sudo bash scripts/server-setup.sh
```

This installs: Node 20, npm, Git, PostgreSQL, Nginx, PM2, UFW, Certbot.

**Follow the printed manual steps** to create the PostgreSQL user and database (section below).

---

## C) PostgreSQL database and user

```bash
sudo -u postgres psql
```

```sql
CREATE USER diar WITH PASSWORD 'YOUR_STRONG_DB_PASSWORD';
CREATE DATABASE property_agah OWNER diar;
GRANT ALL PRIVILEGES ON DATABASE property_agah TO diar;
\c property_agah
GRANT ALL ON SCHEMA public TO diar;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO diar;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO diar;
\q
```

---

## D) Clone the application

```bash
sudo mkdir -p /var/www/diar
sudo chown -R $USER:$USER /var/www/diar
cd /var/www/diar
git clone YOUR_PRIVATE_REPO_URL app
cd app
```

If the Git repo root is the parent folder, clone so that `package.json` lives at `/var/www/diar/app/package.json`.

---

## E) Environment file (`.env`)

```bash
cd /var/www/diar/app
cp .env.example .env
nano .env
```

Required:

```env
DATABASE_URL="postgresql://diar:YOUR_STRONG_DB_PASSWORD@localhost:5432/property_agah"
JWT_SECRET="paste output of: openssl rand -base64 32"
NODE_ENV=production
PORT=3000
```

Bootstrap (run once):

```env
ADMIN_PHONE="09121234567"
ADMIN_PASSWORD="STRONG_ADMIN_PASSWORD"
ADMIN_NAME="ادمین دیار"
```

Optional:

```env
APP_URL="https://diar.yourdomain.com"
PROPERTY_CONTACT_PHONE="021-88776655"
PROPERTY_DAILY_PRICE=3500000
PAYMENT_CARD_NUMBER="6037-9975-0000-0000"
PAYMENT_INSTRUCTIONS="پس از واریز، تصویر رسید را بارگذاری کنید."
```

**Never commit `.env` to Git.**

---

## F) Persistent uploads (critical)

Receipts and property images are stored on disk. **Deploy must not wipe them.**

### Recommended layout

| Path | Purpose |
|------|---------|
| `/var/www/diar/uploads/properties/` | Property gallery images |
| `/var/www/diar/uploads/receipts/` | Payment receipt uploads |
| `/var/www/diar/app/public/uploads` | Symlink → `/var/www/diar/uploads` |

### One-time symlink setup

```bash
cd /var/www/diar/app
mkdir -p /var/www/diar/uploads/properties
mkdir -p /var/www/diar/uploads/receipts

if [[ -L public/uploads ]]; then
  echo "OK: uploads symlink already exists"
elif [[ ! -e public/uploads ]]; then
  ln -sfn /var/www/diar/uploads public/uploads
else
  echo "STOP: public/uploads is a real folder — move files to /var/www/diar/uploads , then replace with symlink"
fi

ls -la public/uploads
```

After this, `scripts/deploy.sh` updates code only — **it does not delete** `/var/www/diar/uploads`.

---

## G) Install dependencies and run migrations

```bash
cd /var/www/diar/app
npm ci
npx prisma generate
npx prisma migrate deploy
```

**Do not run** `npm run prisma:seed` on production (it wipes data and creates test users).

---

## H) Production bootstrap (once)

Creates admin, payment settings, and the single property:

```bash
cd /var/www/diar/app
npx tsx scripts/production-bootstrap.ts
```

Safe to re-run: skips existing admin phone; upserts settings and property content.

---

## I) Copy property images

Copy the 12 `ganje-*.png` files into persistent storage:

```bash
# From your Mac (example):
scp public/uploads/properties/ganje-*.png deploy@YOUR_IP:/var/www/diar/uploads/properties/
```

Verify paths match DB (bootstrap sets paths like `/uploads/properties/ganje-01-entrance.png`).

```bash
ls /var/www/diar/uploads/properties/
curl -I http://127.0.0.1:3000/uploads/properties/ganje-01-entrance.png
```

(After PM2 is running.)

---

## J) Build and start PM2

**First deploy:** run these commands manually (do not use `deploy.sh` until `git pull` works).

```bash
cd /var/www/diar/app
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 status
```

**Later updates:** use `bash scripts/deploy.sh` (section M).

Enable restart on boot:

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
# Run the command PM2 prints, then:
pm2 save
```

Smoke test:

```bash
curl -I http://127.0.0.1:3000/login
```

---

## K) Nginx reverse proxy

1. Copy and edit the example config:

```bash
sudo cp /var/www/diar/app/nginx.diar.conf.example /etc/nginx/sites-available/diar
sudo nano /etc/nginx/sites-available/diar
```

2. Set `server_name` to your domain.

3. Uncomment the HTTPS `server` block when ready, or use HTTP first for testing.

4. Ensure `/uploads/` alias points to persistent storage:

```nginx
location /uploads/ {
    alias /var/www/diar/uploads/;
    expires 7d;
}
```

5. Enable site:

```bash
sudo ln -sf /etc/nginx/sites-available/diar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Proxy headers (required for cookies behind HTTPS):

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Host $host;
```

---

## L) HTTPS with Certbot

```bash
sudo certbot --nginx -d diar.yourdomain.com
```

Renewal is automatic. Test login over **HTTPS** after enabling.

---

## M) Updates — Git push auto-deploy (recommended)

After the one-time server setup (sections A–L), every push to `main` triggers an automatic deploy via GitHub Actions.

### Workflow

```
Cursor / local
  ↓ git commit
  ↓ git push origin main
GitHub Actions
  ↓ SSH into Droplet
  ↓ cd /var/www/diar/app
  ↓ bash scripts/deploy.sh
Website updated (PM2 restart)
```

### One-time: GitHub Actions setup

#### 1. Generate a deploy SSH key (on your Mac)

Use a **dedicated** key — not your personal SSH key:

```bash
ssh-keygen -t ed25519 -C "github-actions-diar-deploy" -f ~/.ssh/diar_deploy -N ""
```

This creates:

- `~/.ssh/diar_deploy` — **private key** (goes into GitHub Secrets)
- `~/.ssh/diar_deploy.pub` — **public key** (goes on the server)

#### 2. Add the public key to the Droplet

```bash
# If using deploy user:
ssh-copy-id -i ~/.ssh/diar_deploy.pub deploy@YOUR_DROPLET_IP

# Or manually append to authorized_keys on the server:
cat ~/.ssh/diar_deploy.pub | ssh deploy@YOUR_DROPLET_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Test it works:

```bash
ssh -i ~/.ssh/diar_deploy deploy@YOUR_DROPLET_IP "echo OK"
```

#### 3. Add GitHub Secrets

In your GitHub repo:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value | Example |
|--------|-------|---------|
| `DROPLET_HOST` | Droplet public IP | `164.92.xxx.xxx` |
| `DROPLET_USER` | SSH user on server | `deploy` (or `root`) |
| `DROPLET_PORT` | SSH port | `22` |
| `DROPLET_SSH_KEY` | Full private key contents | paste entire `~/.ssh/diar_deploy` file |

To copy the private key for pasting:

```bash
cat ~/.ssh/diar_deploy
```

Copy **everything** including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

#### 4. Push the workflow file

The workflow lives at `.github/workflows/deploy.yml` in the repo root. After your first `git push` that includes this file, GitHub Actions will run on every subsequent push to `main`.

Monitor runs: **GitHub repo → Actions tab**.

---

### Server requirements for auto-deploy

Before the first auto-deploy, confirm on the Droplet:

| Requirement | Check |
|-------------|-------|
| Repo cloned at `/var/www/diar/app` | `ls /var/www/diar/app/package.json` |
| `scripts/deploy.sh` exists and is executable | `ls -la /var/www/diar/app/scripts/deploy.sh` |
| Server can `git pull` from GitHub | SSH deploy key or HTTPS token configured in repo |
| `.env` exists on server | `test -f /var/www/diar/app/.env && echo OK` |
| `DATABASE_URL` set in `.env` | `grep DATABASE_URL /var/www/diar/app/.env` |
| PM2 app named `diar` | `pm2 describe diar` |
| Uploads persistent | `ls -la /var/www/diar/app/public/uploads` (symlink or directory) |

**Git pull on server:** the deploy user must be able to pull without a password prompt. Options:

- **SSH deploy key on server** (recommended): add a read-only deploy key in GitHub repo → Settings → Deploy keys.
- **HTTPS with token**: `git remote set-url origin https://<token>@github.com/USER/REPO.git` (store token securely).

---

### What `scripts/deploy.sh` does

1. Preflight: `package.json`, `.env`, `DATABASE_URL` must exist
2. `git pull`
3. `npm ci`
4. `npx prisma generate`
5. `npx prisma migrate deploy`
6. `npm run build`
7. `pm2 restart diar` (or `pm2 start` on first run)
8. `pm2 save`

**Never runs:** `prisma:seed`, upload deletion, or database wipe.

---

### Manual fallback (if GitHub Actions fails)

SSH to the server and run the same script:

```bash
ssh deploy@YOUR_DROPLET_IP
cd /var/www/diar/app
bash scripts/deploy.sh
```

---

### Debugging a failed deployment

1. **GitHub Actions tab** — open the failed run; the SSH step log shows exactly where `deploy.sh` stopped.
2. **Common failures:**

| Symptom in log | Likely cause | Fix |
|----------------|--------------|-----|
| `Permission denied (publickey)` | Wrong `DROPLET_SSH_KEY` or key not on server | Re-add public key to `authorized_keys` |
| `package.json not found` | Wrong app path | Confirm repo is at `/var/www/diar/app` |
| `.env not found` | Missing server env file | Create `.env` from `.env.example` on server |
| `DATABASE_URL is missing` | Empty/missing DB URL in `.env` | Edit server `.env` |
| `git pull` fails | No git credentials on server | Add deploy key (see above) |
| `npm run build` fails | TypeScript/compile error | Fix locally, `npm run build`, push again |
| `migrate deploy` fails | DB unreachable or bad migration | Check Postgres + `DATABASE_URL` on server |
| PM2 not found | PM2 not installed | Run `server-setup.sh` or `npm i -g pm2` |

3. **After fixing**, either push again (triggers Actions) or SSH and run `bash scripts/deploy.sh` manually.

---

## N) Import employees (later)

1. Prepare CSV with header: `name,phone,password`
2. See `scripts/employees.example.csv`
3. Upload to server and run:

```bash
cd /var/www/diar/app
# Preview without writing:
npx tsx scripts/import-employees.ts /path/to/employees.csv --dry-run
# Apply:
npx tsx scripts/import-employees.ts /path/to/employees.csv
```

- Skips duplicate phone numbers
- Does not delete existing users
- Prints created / skipped / failed counts

---

## O) Backup and restore

### Backup

```bash
cd /var/www/diar/app
bash scripts/backup.sh
```

Creates `backups/YYYY-MM-DD-HH-mm/` with:

- `database.dump` (PostgreSQL custom format)
- `uploads.tar.gz` (if uploads found)

Schedule with cron (example, daily 3am):

```bash
crontab -e
# 0 3 * * * cd /var/www/diar/app && bash scripts/backup.sh >> /var/log/diar-backup.log 2>&1
```

### Restore database (example)

**WARNING:** `--clean` drops existing objects before restore. Use only when you intend to replace the DB.

```bash
pg_restore -d property_agah --clean --if-exists backups/YYYY-MM-DD-HH-mm/database.dump
```

### Restore uploads (example)

```bash
tar -xzf backups/YYYY-MM-DD-HH-mm/uploads.tar.gz -C /var/www/diar/
```

---

## P) Common errors and fixes

| Problem | Fix |
|---------|-----|
| Build fails: Prisma client | Run `npx prisma generate` before `npm run build` |
| `JWT_SECRET` error in production | Set `JWT_SECRET` in `.env`, `NODE_ENV=production` |
| Images 404 | Check symlink `public/uploads` → `/var/www/diar/uploads` and files in `properties/` |
| Receipts disappear after deploy | Uploads were not on persistent disk — fix symlink, restore from backup |
| Login fails on HTTPS | Nginx must send `X-Forwarded-Proto https`; access site via HTTPS URL |
| `migrate deploy` fails | Check `DATABASE_URL`, Postgres running, user permissions |
| PM2 not found after reboot | Run `pm2 startup` + `pm2 save` again |
| Wrong property shown | Run `npx tsx scripts/sync-property-content.ts` (updates content only) |
| Port 3000 in use | `pm2 delete diar` then `pm2 start ecosystem.config.cjs` |

---

## Q) Scripts reference

| Script | Where to run | Purpose |
|--------|--------------|---------|
| `scripts/server-setup.sh` | VPS (root/sudo) | First-time OS packages + directories |
| `scripts/deploy.sh` | VPS app dir | Repeatable code updates |
| `scripts/production-bootstrap.ts` | VPS app dir | Once: admin + property + settings |
| `scripts/sync-property-content.ts` | VPS app dir | Update property metadata/images paths only |
| `scripts/import-employees.ts` | VPS app dir | Bulk employee CSV import |
| `scripts/backup.sh` | VPS app dir | DB + uploads backup |

---

## Security checklist

- [ ] Strong `JWT_SECRET` and DB password
- [ ] `.env` not in Git
- [ ] Do not use dev seed or `LOGIN_CREDENTIALS.md` passwords in production
- [ ] HTTPS enabled
- [ ] Postgres listens on localhost only
- [ ] UFW: SSH + Nginx only
- [ ] Remove extra test properties/users from DB if migrated from dev
