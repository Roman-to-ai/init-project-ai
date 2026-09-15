@echo off
chcp 65001 > nul
echo.
echo [信息] 启动前端开发服务器（Vite）
echo.

%~d0
cd %~dp0
cd ..

call pnpm dev

pause
