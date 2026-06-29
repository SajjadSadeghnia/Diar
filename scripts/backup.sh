#!/usr/bin/env bash
# =============================================================================
# دیار — backup PostgreSQL + uploads (run on VPS)
#
# Usage (from app directory):
#   bash scripts/backup.sh
#
# Reads DATABASE_URL from .env in app root.
# Writes to: backups/YYYY-MM-DD-HH-mm/ (never overwrites previous backups)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${APP_DIR}"

TIMESTAMP="$(date +%Y-%m-%d-%H-%M)"
BACKUP_ROOT="${APP_DIR}/backups/${TIMESTAMP}"

# Load DATABASE_URL from .env (safe for special characters in password)
if [[ -f .env ]]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d '=' -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")"
  export DATABASE_URL
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set. Add it to .env or export it."
  exit 1
fi

mkdir -p "${BACKUP_ROOT}"

echo "==> دیار backup"
echo "    Destination: ${BACKUP_ROOT}"
echo ""

echo "==> PostgreSQL dump..."
pg_dump "${DATABASE_URL}" --no-owner --format=custom -f "${BACKUP_ROOT}/database.dump"
echo "    Saved: database.dump"

# Uploads: prefer persistent path, then public/uploads
UPLOADS_SRC=""
if [[ -L public/uploads ]]; then
  UPLOADS_SRC="$(readlink -f public/uploads)"
elif [[ -d public/uploads ]]; then
  UPLOADS_SRC="${APP_DIR}/public/uploads"
elif [[ -d /var/www/diar/uploads ]]; then
  UPLOADS_SRC="/var/www/diar/uploads"
fi

if [[ -n "${UPLOADS_SRC}" && -d "${UPLOADS_SRC}" ]]; then
  echo "==> Uploads archive (${UPLOADS_SRC})..."
  tar -czf "${BACKUP_ROOT}/uploads.tar.gz" -C "$(dirname "${UPLOADS_SRC}")" "$(basename "${UPLOADS_SRC}")"
  echo "    Saved: uploads.tar.gz"
else
  echo "WARNING: uploads directory not found — skipped."
fi

echo "${TIMESTAMP}" > "${BACKUP_ROOT}/timestamp.txt"
echo "==> Backup complete: ${BACKUP_ROOT}"
ls -lah "${BACKUP_ROOT}"
