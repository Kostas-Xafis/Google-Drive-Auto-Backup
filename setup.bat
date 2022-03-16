@echo off

set startup=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set projectDir=%CD%

cd "%startup%"

echo node %projectDir%\js\backupAll.js -s -ls > "backup.bat"