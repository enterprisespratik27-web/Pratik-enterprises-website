@echo off
cd /d "%~dp0"
echo Starting Pratik Enterprises website...
echo.
echo Keep this black window open.
echo.
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000/ && start http://localhost:3000/vendor-login.html"
"C:\Program Files\nodejs\node.exe" "%~dp0server.js"
pause
