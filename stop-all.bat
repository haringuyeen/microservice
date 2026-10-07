@echo off
chcp 65001 > nul
title Dung cac service WMS
echo ========================================================
echo   DANG TAT CAC DICH VU WMS...
echo ========================================================
call "%~dp0start-all.bat" stop
echo.
pause
