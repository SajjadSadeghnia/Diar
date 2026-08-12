#!/usr/bin/env bash
# Idempotently install nightly backup cron for دیار (3 AM server time).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CRON_LINE="0 3 * * * cd ${APP_DIR} && bash scripts/backup.sh >> /var/log/diar-backup.log 2>&1"
MARKER="# diar-backup-cron"

existing="$(crontab -l 2>/dev/null || true)"
if echo "${existing}" | grep -Fq "${MARKER}"; then
  echo "==> backup cron already installed"
  exit 0
fi

{
  echo "${existing}"
  echo "${MARKER}"
  echo "${CRON_LINE}"
} | crontab -

echo "==> backup cron installed (daily 03:00)"
