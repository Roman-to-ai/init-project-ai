@echo off
chcp 65001 > nul
echo.
echo [信息] 构建前端生产包（输出到 dist 目录）
echo.

%~d0
cd %~dp0
cd ..

call pnpm build:prod

pause
