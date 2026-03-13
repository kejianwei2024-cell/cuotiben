@echo off
chcp 65001 >nul
echo 正在尝试用 winget 安装 Git...
echo.
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements 2>nul
if errorlevel 1 (
  echo winget 不可用，正在打开 Git 官方下载页...
  start https://git-scm.com/download/win
  echo.
  echo 请在弹出的网页中下载并运行安装包，安装时一路 Next。
  echo 装完后务必：关闭所有黑色命令窗口，再双击运行「一键推送到你的仓库.bat」。
  echo.
) else (
  echo.
  echo Git already installed.
  echo Close this window, then double-click: 一键推送到你的仓库.bat
  echo If still error, restart PC and try again.
  echo.
)
pause
