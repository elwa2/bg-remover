@echo off
title Background Remover App
cd /d "%~dp0"

echo Starting Background Remover App...

:: Check if Python exists
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Please install Python and try again.
    pause
    exit /b
)

:: Check required libraries
echo Checking required libraries...
pip install -r requirements.txt >nul 2>&1

:: Run main.py in a visible window to see any errors
echo Starting server...
start "Background Remover Server" python main.py

:: Wait 10 seconds to ensure server is running
echo Please wait 10 seconds for server to start...
timeout /t 10 /nobreak >nul

:: Check if server is running
echo Checking if server is running...
curl -s http://localhost:8000 >nul
if %errorlevel% neq 0 (
    echo Server is not running. Please check for errors in the server window.
    echo Press any key to exit...
    pause >nul
    exit /b
)

:: Open browser at http://localhost:8000/
echo Opening browser...
start "" "http://localhost:8000/"

:: Keep this window open
echo Server is running. You can close this window when you're done.
echo To stop the server, run stop_bg_remover.bat
pause >nul
