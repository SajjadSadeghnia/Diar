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
  if git diff-tree --no-commit-id --name-only -r ORIG_HEAD HEAD 2>/dev/null | grep -q '^scripts/deploy.sh$'; then
    echo "==> deploy.sh updated — re-running with latest steps"
    exec bash "${BASH_SOURCE[0]}" "$@"
  fi
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

step "configure nginx"
if command -v nginx >/dev/null 2>&1; then
  bash scripts/configure-nginx.sh || echo "WARNING: nginx configure failed — app still on port 3000"
else
  echo "    SKIP: nginx not installed"
fi

step "setup backup cron"
bash scripts/setup-backup-cron.sh || echo "WARNING: backup cron setup failed"

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
echo "Smoke test (app):  curl -s http://127.0.0.1:3000/api/health"
echo "Smoke test (nginx): curl -sI http://127.0.0.1/login | head -1"
curl -sf http://127.0.0.1:3000/api/health >/dev/null && echo "    app health: OK" || echo "    app health: FAILED"
curl -sfI http://127.0.0.1/login 2>/dev/null | head -1 || echo "    nginx: not responding on :80"
