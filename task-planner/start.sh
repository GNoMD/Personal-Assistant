#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export NODE_ENV=production
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-13222}"

mkdir -p data

OFFLINE=0
if [ -f .offline-pack ] || [ -f backend/.offline-pack ]; then
  OFFLINE=1
fi
if [ -d backend/node_modules/better-sqlite3 ] && [ "$OFFLINE" = "1" ]; then
  echo "检测到全离线包，跳过 npm install"
elif [ -d backend/node_modules/better-sqlite3 ] && [ "${SKIP_NPM_INSTALL:-}" = "1" ]; then
  echo "SKIP_NPM_INSTALL=1，跳过 npm install"
else
  echo "Installing backend dependencies..."
  npm install --prefix backend --omit=dev
fi

echo "Starting on http://${HOST}:${PORT} ..."
npm start --prefix backend
