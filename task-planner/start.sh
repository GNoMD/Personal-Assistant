#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

export NODE_ENV=production
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-3001}"

mkdir -p data

echo "Installing backend dependencies..."
npm install --prefix backend --omit=dev

echo "Starting on http://${HOST}:${PORT} ..."
npm start --prefix backend
