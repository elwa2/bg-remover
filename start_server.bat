@echo off
title Background Remover Server
cd /d "%~dp0"

echo Starting Background Remover Server...
echo When you close this window, the server will stop automatically.

:: Clean temp folder before starting
if exist temp (
    del /q temp\* >nul 2>&1
)

:: Install required libraries if needed
pip install -r requirements.txt >nul 2>&1

:: Open browser after 5 seconds
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:8000/"

:: Run the server directly - when this window is closed, the server will stop
python main.py

:: This will only execute if the server crashes
echo Server stopped unexpectedly.
echo Press any key to exit...
pause >nul
