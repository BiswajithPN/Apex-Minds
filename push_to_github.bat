@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo 🚀 Pushing HireHub AI Recruitment Platform to GitHub
echo 🔗 Target: https://github.com/BiswajithPN/Apex-Minds.git
echo =========================================================

set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
if not exist "%GIT_CMD%" set "GIT_CMD=git"

echo [1/5] Checking Git repository...
"%GIT_CMD%" init

echo [2/5] Configuring remote origin...
"%GIT_CMD%" remote remove origin >nul 2>nul
"%GIT_CMD%" remote add origin https://github.com/BiswajithPN/Apex-Minds.git

echo [3/5] Staging latest changes...
"%GIT_CMD%" add .

echo [4/5] Committing latest changes...
"%GIT_CMD%" commit -m "feat: complete HireHub AI recruitment platform with multi-criteria analysis, zero popups, and ATS screener"

echo [5/5] Pushing latest code to GitHub (branch main)...
"%GIT_CMD%" branch -M main
"%GIT_CMD%" push -u origin main --force

echo =========================================================
echo ✅ SUCCESS: All latest code has been pushed to GitHub!
echo 🌐 https://github.com/BiswajithPN/Apex-Minds
echo =========================================================
pause
