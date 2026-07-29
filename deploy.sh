#!/usr/bin/env bash
set -euo pipefail

SSH_HOST="${SSH_HOST:-socket-server}"
REMOTE_DIR="${REMOTE_DIR:-/home/socket/live/songdrop-socket-server}"
PM2_APP_NAME="${PM2_APP_NAME:-index}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Deploying SongDrop socket server"
echo "    Host:   ${SSH_HOST}"
echo "    Remote: ${REMOTE_DIR}"

echo "==> Syncing files (preserving remote .env)"
rsync -az --delete \
  --exclude '.git/' \
  --exclude 'node_modules/' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  --exclude 'socket-files.zip' \
  --exclude 'deploy.sh' \
  --exclude '*.md' \
  "${SCRIPT_DIR}/" \
  "${SSH_HOST}:${REMOTE_DIR}/"

echo "==> Installing deps and restarting via PM2"
ssh "${SSH_HOST}" bash -s -- "${REMOTE_DIR}" "${PM2_APP_NAME}" <<'REMOTE'
set -euo pipefail
REMOTE_DIR="$1"
PM2_APP_NAME="$2"
export PATH="/home/socket/node/bin:$PATH"

cd "${REMOTE_DIR}"
npm install --omit=dev

if pm2 describe "${PM2_APP_NAME}" >/dev/null 2>&1; then
  pm2 restart "${PM2_APP_NAME}" --update-env
else
  pm2 start index.js --name "${PM2_APP_NAME}"
fi

pm2 save
pm2 status "${PM2_APP_NAME}"
REMOTE

echo "==> Deploy complete"
echo "    Health: https://socket.felixandfingers.com/health"
