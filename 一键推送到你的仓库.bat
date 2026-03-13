@echo off
chcp 65001 >nul
cd /d "%~dp0"

rem 确保能找到 Git（安装后未重启时也生效）
if exist "%ProgramFiles%\Git\cmd\git.exe" set "PATH=%ProgramFiles%\Git\cmd;%PATH%"
if exist "%ProgramFiles(x86)%\Git\cmd\git.exe" set "PATH=%ProgramFiles(x86)%\Git\cmd;%PATH%"

echo 正在推送到 GitHub: kejianwei2024-cell/cuotiben
echo.

if not exist ".git" (
  echo 正在初始化...
  git init
)
rem 为本仓库设置提交者信息，避免 fatal: unable to auto-detect email address
git config user.email "kejianwei2024-cell@users.noreply.github.com"
git config user.name "kejianwei2024-cell"

git add .
git add .github 2>nul
git add .github/workflows 2>nul
git add .github/workflows/build-apk.yml 2>nul
git commit -m "错题本"
if errorlevel 1 git commit --allow-empty -m "initial"
git branch -M main

git remote remove origin 2>nul
git remote add origin https://github.com/kejianwei2024-cell/cuotiben.git
git push -u origin main

if errorlevel 1 (
  echo.
  echo If asked to login, use browser to sign in with GitHub.
  echo.
)
echo.
pause
