#!/usr/bin/env bash
# Install/update Nginx site config for دیار and reload Nginx.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
CONF_SRC="${APP_DIR}/nginx.diar.conf"
CONF_DEST="/etc/nginx/sites-available/diar"
ENABLED="/etc/nginx/sites-enabled/diar"

if [[ ! -f "${CONF_SRC}" ]]; then
  echo "ERROR: ${CONF_SRC} not found" >&2
  exit 1
fi

echo "==> configure nginx for diar"

sudo cp "${CONF_SRC}" "${CONF_DEST}"
sudo ln -sf "${CONF_DEST}" "${ENABLED}"

# Disable default site if it conflicts with default_server
if [[ -L /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl reload nginx

echo "==> nginx configured and reloaded"
