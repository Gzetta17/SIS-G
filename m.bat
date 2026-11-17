@echo off
if "%1"=="ABIERTO" goto INICIO
start "AMS Elite Pro - Servidor" cmd /k "%~f0" ABIERTO
exit

:INICIO
cd /d "%~dp0"
color 0B
echo ====================================================
echo       INICIANDO SERVIDOR AMS ELITE PRO
echo ====================================================
echo Carpeta de trabajo: %CD%
echo.

if not exist "server.js" goto ERROR_ARCHIVO

where node >nul 2>nul
if errorlevel 1 goto ERROR_NODE

if not exist "package.json" call npm init -y
if not exist "node_modules" call npm install express mongoose cors

echo.
echo Abriendo navegador en http://localhost:3000 ...
start "" "http://localhost:3000"

echo.
echo Levantando servidor Node.js...
echo ====================================================
node server.js

echo.
echo [AVISO] El servidor se detuvo.
pause
exit /b

:ERROR_ARCHIVO
color 0C
echo [ERROR] No se encuentra el archivo "server.js" en esta carpeta.
echo Verifica que no se llame "server.js.txt".
pause
exit /b

:ERROR_NODE
color 0C
echo [ERROR] Node.js no esta instalado en esta computadora.
echo Descargalo e instalalo desde: https://nodejs.org
pause
exit /b