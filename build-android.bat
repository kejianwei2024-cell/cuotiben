@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在安装 Capacitor 与 Android 依赖...
call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/http --save
if errorlevel 1 ( echo npm install 失败 & pause & exit /b 1 )
echo.
echo 添加 Android 平台...
call npx cap add android
if errorlevel 1 ( echo cap add android 失败 & pause & exit /b 1 )
echo.
echo 同步网页到 Android 工程...
call npx cap sync
if errorlevel 1 ( echo cap sync 失败 & pause & exit /b 1 )
echo.
echo 完成。用 Android Studio 打开 android 文件夹即可编译 APK，或运行: npx cap open android
pause
