@echo off
title WeatherRoute Launcher
color 0b

echo ==========================================================
echo          WeatherRoute — 1-Click Startup Launcher
echo ==========================================================
echo.

cd /d "%~dp0"

REM 1. Activate or create virtualenv
if not exist "venv" (
    echo [*] Creating Python virtual environment...
    python -m venv venv
    call .\venv\Scripts\activate.bat
    echo [*] Installing backend dependencies...
    pip install -r backend\requirements.txt
) else (
    echo [*] Activating virtual environment...
    call .\venv\Scripts\activate.bat
)

REM 2. Migrate database
echo [*] Applying migrations...
python backend\manage.py migrate --noinput

REM 3. Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo [*] Installing frontend packages...
    cd frontend
    call npm install
    cd ..
)

REM 4. Launch Backend in a separate window
echo [*] Launching Django backend on http://127.0.0.1:8000 ...
start "WeatherRoute Backend (Django)" cmd /k "title WeatherRoute Backend & cd /d %~dp0 & call .\venv\Scripts\activate.bat & python backend\manage.py runserver 127.0.0.1:8000"

REM 5. Launch Frontend in a separate window
echo [*] Launching React frontend on http://127.0.0.1:5173 ...
start "WeatherRoute Frontend (Vite)" cmd /k "title WeatherRoute Frontend & cd /d %~dp0\frontend & npx vite --host 127.0.0.1 --port 5173"

REM 6. Wait 3 seconds and launch browser
timeout /t 3 /nobreak >nul
echo [*] Opening application in browser...
start http://127.0.0.1:5173

echo.
echo ==========================================================
echo [SUCCESS] WeatherRoute is running!
echo   Frontend:    http://127.0.0.1:5173
echo   Backend API: http://127.0.0.1:8000/api/
echo ==========================================================
echo.
pause
