@echo off
cd /d "%~dp0"

if not exist data mkdir data

echo Installing backend dependencies...
cd backend
call npm install --omit=dev
cd ..

set NODE_ENV=production
if not defined HOST set HOST=0.0.0.0
if not defined PORT set PORT=3001

echo Starting on http://%HOST%:%PORT% ...
npm start --prefix backend
