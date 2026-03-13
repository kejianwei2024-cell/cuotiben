@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   错题本 - 推送到 GitHub 并自动打 APK
echo ========================================
echo.

if not exist ".git" (
  echo 正在初始化 Git 仓库...
  git init
  git branch -M main
  echo.
)

echo 正在添加文件并提交...
git add .
git status
git commit -m "错题本：初二错题本 APP" 2>nul || git commit -m "update" 2>nul
if errorlevel 1 (
  echo.
  echo 若上面显示 "nothing to commit"，说明已提交过，可直接执行下面的推送。
  echo.
)

echo.
echo ========================================
echo   下一步（在浏览器和本机各做一次）
echo ========================================
echo.
echo 1. 打开 https://github.com/new
echo    仓库名填：cuotiben（或任意英文名）
echo    选 Public，不要勾选 Add a README
echo    点 Create repository
echo.
echo 2. 在本文件夹打开「命令提示符」或 PowerShell，按你的仓库地址执行（把 你的用户名 换成你的 GitHub 用户名）：
echo.
echo    git remote add origin https://github.com/你的用户名/cuotiben.git
echo    git push -u origin main
echo.
echo    若提示要登录，按提示用浏览器或 Personal Access Token 完成认证。
echo.
echo 3. 推送成功后，打开 https://github.com/你的用户名/cuotiben/actions
echo    等「Build Android APK」跑完，在 Artifacts 里下载「错题本-APP」即得 APK。
echo.
echo ========================================
pause
