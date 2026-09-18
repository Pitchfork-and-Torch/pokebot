@echo off
cd /d "%~dp0"
if not exist "dist\index.html" (
  echo Build missing. Run: npm install ^&^& npm run build
  pause
  exit /b 1
)
start "" "http://127.0.0.1:4173/"
py -3 -m http.server 4173 --bind 127.0.0.1 --directory dist
