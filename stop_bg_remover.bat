@echo off
title Stop Background Remover App
color 0C

echo Stopping Background Remover App...

:: Stop all python processes running main.py
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im pythonw.exe >nul 2>&1

:: Clean temporary files
echo Cleaning temporary files...
if exist temp (
    del /q temp\* >nul 2>&1
)

echo Application stopped successfully.
timeout /t 3 /nobreak >nul
exit
