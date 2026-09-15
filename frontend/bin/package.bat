@echo off
chcp 65001 > nul
echo.
echo [信息] 安装前端依赖（node_modules）
echo        包管理器是 pnpm —— 本仓库不用 npm / yarn。
echo.

%~d0
cd %~dp0
cd ..

call pnpm install

pause
