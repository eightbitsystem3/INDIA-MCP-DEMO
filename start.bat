@echo off
title INDIA MCP DEMO STARTER

echo =========================================
echo Starting INDIA MCP DEMO Applications
echo =========================================

REM =====================================================
REM 1. SPRING BOOT APP 1
REM =====================================================
echo Starting Spring Boot App 1...
start "SPRING BOOT APP 1" cmd /k "title SPRING BOOT APP 1 && java -jar spring-boot-app\target\mcpdemo-0.0.1-SNAPSHOT.jar"

timeout /t 10 /nobreak > nul

REM =====================================================
REM 2. SPRING BOOT APP 2
REM =====================================================
echo Starting Spring Boot App 2...
start "SPRING BOOT APP 2" cmd /k "title SPRING BOOT APP 2 && java -jar spring-boot-app2\target\mcpdemo2-0.0.1-SNAPSHOT.jar"

timeout /t 10 /nobreak > nul

REM =====================================================
REM 3. MCP SERVER
REM =====================================================
echo Starting MCP Server...
start "MCP SERVER" cmd /k "title MCP SERVER && node mcp-server\server.js"

timeout /t 5 /nobreak > nul

REM =====================================================
REM 4. MCP CLIENT
REM =====================================================
echo Starting MCP Client...
start "MCP CLIENT" cmd /k "title MCP CLIENT && node client\client.js"

echo =========================================
echo All Applications Started Successfully
echo =========================================

pause