@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo 🚀 Pushing HireHub AI Recruitment Platform to GitHub
echo 🔗 Target: https://github.com/BiswajithPN/Apex-Minds.git
echo =========================================================

REM Locate git executable
set "GIT_CMD=git"
where git >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    ) else if exist "C:\Program Files\Git\bin\git.exe" (
        set "GIT_CMD=C:\Program Files\Git\bin\git.exe"
    ) else (
        echo [ERROR] Git is not yet installed. Please complete the installer on your screen.
        pause
        exit /b 1
    )
)

echo [1/6] Initializing Git repository...
"%GIT_CMD%" init

echo [2/6] Configuring remote origin...
"%GIT_CMD%" remote remove origin >nul 2>nul
"%GIT_CMD%" remote add origin https://github.com/BiswajithPN/Apex-Minds.git

echo [3/6] Staging files...
"%GIT_CMD%" add .

echo [4/6] Committing changes...
"%GIT_CMD%" commit -m "feat: HireHub AI Recruitment & Intelligent Screening Platform"

echo [5/6] Renaming branch to main...
"%GIT_CMD%" branch -M main

echo [6/6] Pushing to GitHub (https://github.com/BiswajithPN/Apex-Minds)...
"%GIT_CMD%" push -u origin main

echo =========================================================
echo ✅ Push complete! Check your repository on GitHub.
echo =========================================================
pause
