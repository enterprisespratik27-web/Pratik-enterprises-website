@echo off
cd /d "%~dp0"
echo Starting Pratik Enterprises backend...
echo.
echo Running from: %CD%
echo.
echo Website: http://localhost:3000
echo Vendor:  http://localhost:3000/vendor-login.html
echo User:    http://localhost:3000/user-login.html
echo.
echo Keep this window open while using the website.
echo Press Ctrl+C to stop the server.
echo.
"C:\Program Files\nodejs\node.exe" "%~dp0server.js"
pause
