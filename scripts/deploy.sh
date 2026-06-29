#!/usr/bin/env bash
# =============================================================================
# دیار — production deploy / update (run on the VPS inside the app directory)
#
# Usage (from /var/www/diar/app):
#   bash scripts/deploy.sh
#
# Safe: does NOT run prisma seed, does NOT delete uploads or database data.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${APP_DIR}"

fail() {
  echo "ERROR: $1" >&2
  exit 1
}

# --- Preflight checks (fail fast with clear messages) -----------------------
if [[ ! -f package.json ]]; then
  fail "package.json not found in ${APP_DIR}. Run this from the app root (e.g. /var/www/diar/app)."
fi

if [[ ! -f .env ]]; then
  fail ".env not found in ${APP_DIR}. Create it from .env.example before deploying."
fi

# DATABASE_URL must be present and non-empty in .env
if ! grep -Eq '^[[:space:]]*DATABASE_URL=.+' .env; then
  fail "DATABASE_URL is missing or empty in ${APP_DIR}/.env."
fi

echo "==> دیار deploy"
echo "    Directory: ${APP_DIR}"
echo "    Time:      $(date -Iseconds)"
echo ""

# Warn if persistent uploads are missing (non-fatal — receipts/images live here)
if [[ ! -d public/uploads ]] && [[ ! -L public/uploads ]]; then
  echo "WARNING: public/uploads is missing."
  echo "         Create persistent uploads — see DEPLOYMENT.md (symlink section)."
  echo ""
fi

step() {
  echo ""
  echo "==> $1"
}

step "git pull"
if [[ -d .git ]]; then
  git pull
else
  echo "    SKIP: not a git repository (OK on first manual install)."
fi

step "npm ci"
npm ci

step "prisma generate"
npx prisma generate

step "prisma migrate deploy"
npx prisma migrate deploy

step "npm run build"
npm run build

step "pm2 restart or start"
if pm2 describe diar >/dev/null 2>&1; then
  pm2 restart diar
else
  pm2 start ecosystem.config.cjs
fi

pm2 save

echo ""
echo "==> Deploy complete."
pm2 status diar || true
echo ""
echo "Smoke test: curl -I http://127.0.0.1:3000/login"
