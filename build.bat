@echo off
echo ========================================
echo Scythe Ops BYOD - Build Script
echo ========================================
echo.

:: Build the app
echo Building application...
call npm run tauri build
if errorlevel 1 (
    echo ERROR: Build failed!
    exit /b 1
)
echo.

:: Extract version from tauri.conf.json
setlocal enabledelayedexpansion
for /f "tokens=2 delims=:," %%a in ('findstr /C:"\"version\":" src-tauri\tauri.conf.json') do (
    set "VERSION=%%~a"
    set "VERSION=!VERSION: =!"
    set "VERSION=!VERSION:"=!"
    goto :got_version
)
:got_version
echo Version: %VERSION%
echo.

echo ========================================
echo Build completed!
echo.
echo Installers located at:
echo   NSIS: src-tauri\target\release\bundle\nsis\Scythe Ops_%VERSION%_x64-setup.exe
echo   MSI:  src-tauri\target\release\bundle\msi\Scythe Ops_%VERSION%_x64_en-US.msi
echo.
echo Or run directly:
echo   src-tauri\target\release\scytheops.exe
echo ========================================
