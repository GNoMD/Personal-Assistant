@echo off
cd /d "%~dp0"

if not exist data mkdir data

set "OFFLINE=0"
if exist .offline-pack set "OFFLINE=1"
if exist backend\.offline-pack set "OFFLINE=1"

if "%OFFLINE%"=="1" if exist backend\node_modules\better-sqlite3 (
  echo Offline pack detected, skipping npm install
  goto :start
)

if "%SKIP_NPM_INSTALL%"=="1" if exist backend\node_modules\better-sqlite3 (
  echo SKIP_NPM_INSTALL=1, skipping npm install
  goto :start
)

echo Installing backend dependencies...
cd backend
call npm install --omit=dev
cd ..

:start
set NODE_ENV=production
if not defined HOST set HOST=0.0.0.0
if not defined PORT set PORT=13222

echo Starting on http://%HOST%:%PORT% ...
npm start --prefix backend
