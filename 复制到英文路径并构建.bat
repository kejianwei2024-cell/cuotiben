@echo off
chcp 65001 >nul
set "SRC=%~dp0"
set "DEST=C:\cuotiben"
echo 目标目录: %DEST%
echo 源目录: %SRC%
echo.

if not exist "%DEST%" mkdir "%DEST%"
echo 正在复制文件到 %DEST% ...
xcopy /E /Y /Q "%SRC%*" "%DEST%\" >nul 2>&1
if errorlevel 1 (
  echo 复制失败，请手动把「错题本」文件夹复制到 C:\cuotiben 后重试
  pause
  exit /b 1
)
echo 复制完成.
echo.

cd /d "%DEST%"
echo 正在安装依赖 (npm install)...
call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/http --save
if errorlevel 1 (
  echo npm install 失败，请检查是否已安装 Node.js
  pause
  exit /b 1
)

if not exist "android" (
  echo 正在添加 Android 平台...
  call npx cap add android
  if errorlevel 1 (
    echo cap add android 失败
    pause
    exit /b 1
  )
)

echo 正在同步网页到 Android 工程...
call npx cap sync
if errorlevel 1 (
  echo cap sync 失败
  pause
  exit /b 1
)

echo.
echo ========================================
echo 完成。请用 Android Studio 打开：
echo   %DEST%\android
echo 然后菜单 Build - Build APK(s)
echo APK 输出在 android\app\build\outputs\apk\debug\
echo ========================================
pause
