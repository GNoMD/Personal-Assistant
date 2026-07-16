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

mkdir -p data logs

PID_FILE="${PID_FILE:-data/task-planner.pid}"
LOG_FILE="${LOG_FILE:-logs/task-planner.log}"

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

if [ -f "$PID_FILE" ]; then
  OLD_PID="$(tr -d '[:space:]' < "$PID_FILE" || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "已在运行中（pid=$OLD_PID）。若要重启请先："
    echo "  kill $OLD_PID && rm -f $PID_FILE"
    echo "  ./start.sh"
    exit 0
  fi
  rm -f "$PID_FILE"
fi

echo "Starting in background on http://${HOST}:${PORT} ..."
nohup node backend/src/index.js >>"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
echo "已后台启动 pid=$(cat "$PID_FILE")"
echo "日志: $LOG_FILE"
echo "停止: kill \$(cat $PID_FILE) && rm -f $PID_FILE"
