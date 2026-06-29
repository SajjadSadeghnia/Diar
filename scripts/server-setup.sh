#!/usr/bin/env bash
# =============================================================================
# دیار (Diar) — Ubuntu VPS first-time setup
# Run as root on a FRESH Ubuntu 22.04 / 24.04 Droplet only:
#   sudo bash scripts/server-setup.sh
#
# Does NOT deploy the app. Prepares Node, Postgres, Nginx, PM2, firewall, dirs.
# WARNING: UFW is reset (firewall rules cleared). Do not re-run on production
#          unless you understand the impact.
# =============================================================================

set -euo pipefail

APP_ROOT="/var/www/diar"
UPLOADS_ROOT="${APP_ROOT}/uploads"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

echo "==> دیار server setup (Ubuntu)"
echo "    App root:      ${APP_ROOT}"
echo "    Uploads root:  ${UPLOADS_ROOT}"
echo ""

if [[ "${EUID}" -ne 0 ]]; then
  echo "ERROR: Run with sudo or as root."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "==> Updating apt packages..."
apt-get update -qq
apt-get upgrade -y -qq

echo "==> Installing base packages..."
apt-get install -y -qq \
  curl \
  git \
  gnupg \
  ca-certificates \
  lsb-release \
  ufw \
  nginx \
  postgresql \
  postgresql-contrib \
  postgresql-client \
  certbot \
  python3-certbot-nginx \
  build-essential

# -----------------------------------------------------------------------------
# Node.js 20 LTS (NodeSource)
# -----------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  echo "==> Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
else
  echo "==> Node.js already installed: $(node -v)"
fi

echo "    node: $(node -v)"
echo "    npm:  $(npm -v)"

# -----------------------------------------------------------------------------
# PM2 (global)
# -----------------------------------------------------------------------------
if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing PM2 globally..."
  npm install -g pm2
else
  echo "==> PM2 already installed: $(pm2 -v)"
fi

# -----------------------------------------------------------------------------
# PostgreSQL
# -----------------------------------------------------------------------------
PG_VERSION="$(psql --version 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo '?')"
echo "==> PostgreSQL version: ${PG_VERSION}"
systemctl enable postgresql
systemctl start postgresql

echo ""
echo "-----------------------------------------------------------------------------"
echo "MANUAL STEP — PostgreSQL database and user"
echo "-----------------------------------------------------------------------------"
echo "Run as postgres (replace passwords and names):"
echo ""
echo "  sudo -u postgres psql"
echo ""
echo "  CREATE USER diar WITH PASSWORD 'YOUR_STRONG_PASSWORD';"
echo "  CREATE DATABASE property_agah OWNER diar;"
echo "  GRANT ALL PRIVILEGES ON DATABASE property_agah TO diar;"
echo "  \\q"
echo ""
echo "Then set DATABASE_URL in ${APP_ROOT}/app/.env , for example:"
echo "  postgresql://diar:YOUR_STRONG_PASSWORD@localhost:5432/property_agah"
echo "-----------------------------------------------------------------------------"
echo ""

# -----------------------------------------------------------------------------
# Deploy user (optional but recommended)
# -----------------------------------------------------------------------------
if ! id "${DEPLOY_USER}" &>/dev/null; then
  echo "==> Creating deploy user: ${DEPLOY_USER}"
  adduser --disabled-password --gecos "" "${DEPLOY_USER}"
  usermod -aG sudo "${DEPLOY_USER}" 2>/dev/null || true
  echo "MANUAL: Copy your SSH key to /home/${DEPLOY_USER}/.ssh/authorized_keys"
else
  echo "==> Deploy user already exists: ${DEPLOY_USER}"
fi

# -----------------------------------------------------------------------------
# App directories and persistent uploads
# -----------------------------------------------------------------------------
echo "==> Creating directories..."
mkdir -p "${APP_ROOT}"
mkdir -p "${UPLOADS_ROOT}/properties"
mkdir -p "${UPLOADS_ROOT}/receipts"
mkdir -p "${APP_ROOT}/backups"

# App will live at ${APP_ROOT}/app (git clone target)
mkdir -p "${APP_ROOT}/app"

chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_ROOT}" 2>/dev/null || chown -R root:root "${APP_ROOT}"

echo ""
echo "Uploads persistence:"
echo "  Persistent storage: ${UPLOADS_ROOT}/"
echo "  After cloning the repo to ${APP_ROOT}/app , create a symlink:"
echo ""
echo "    cd ${APP_ROOT}/app"
echo "    # If public/uploads does not exist yet (first install only):"
echo "    #   rm -rf public/uploads   <-- NEVER if receipts/ already has files"
echo "    ln -sfn ${UPLOADS_ROOT} public/uploads"
echo ""
echo "  Property images go in: ${UPLOADS_ROOT}/properties/"
echo "  Receipt uploads go in: ${UPLOADS_ROOT}/receipts/"
echo "  The deploy script never deletes these folders."
echo ""

# -----------------------------------------------------------------------------
# UFW firewall
# -----------------------------------------------------------------------------
echo "==> Configuring UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# -----------------------------------------------------------------------------
# Nginx / Certbot
# -----------------------------------------------------------------------------
systemctl enable nginx
systemctl start nginx
echo "==> Nginx installed. Copy nginx.diar.conf.example after you have a domain."
echo "==> Certbot installed. After Nginx site is ready:"
echo "    sudo certbot --nginx -d your.domain.com"
echo ""

# -----------------------------------------------------------------------------
# PM2 startup (run after first deploy as deploy user)
# -----------------------------------------------------------------------------
echo "-----------------------------------------------------------------------------"
echo "After first successful deploy (as ${DEPLOY_USER}):"
echo "  cd ${APP_ROOT}/app"
echo "  pm2 start ecosystem.config.cjs"
echo "  pm2 save"
echo "  sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u ${DEPLOY_USER} --hp /home/${DEPLOY_USER}"
echo "-----------------------------------------------------------------------------"
echo ""
echo "==> Server setup finished."
echo "Next: clone repo to ${APP_ROOT}/app , configure .env , run migrations & bootstrap."
