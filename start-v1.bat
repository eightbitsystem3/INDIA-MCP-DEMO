@echo off
setlocal

title INDIA MCP DEMO STARTER

echo =========================================
echo Starting INDIA MCP DEMO Applications
echo =========================================

REM =====================================================
REM GO TO BATCH FILE DIRECTORY
REM =====================================================
cd /d %~dp0

REM =====================================================
REM CHECK WINDOWS TERMINAL
REM =====================================================
where wt >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Windows Terminal is not installed.
    echo Install it from:
    echo https://aka.ms/terminal
    echo.
    pause
    exit /b
)

REM =====================================================
REM OPEN ALL APPS IN SEPARATE TABS
REM =====================================================

wt ^
new-tab --title "SPRING BOOT APP 1" cmd /k "cd /d %~dp0spring-boot-app && java -jar target\mcpdemo-0.0.1-SNAPSHOT.jar" ^
; new-tab --title "SPRING BOOT APP 2" cmd /k "cd /d %~dp0spring-boot-app2 && java -jar target\mcpdemo2-0.0.1-SNAPSHOT.jar" ^
; new-tab --title "MCP SERVER" cmd /k "cd /d %~dp0mcp-server && node server.js" ^
; new-tab --title "MCP CLIENT" cmd /k "cd /d %~dp0client && node client.js"

echo.
echo =========================================
echo All Applications Started Successfully
echo =========================================

pause