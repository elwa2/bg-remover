@echo off
title Open Browser
cd /d "%~dp0"

echo Opening browser at http://localhost:8000/
start "" "http://localhost:8000/"

exit
