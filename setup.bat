@echo off
title Flow Studio Pro - 环境自检与一键安装器
chcp 65001 >nul
echo ========================================================
echo    🎬 Flow Studio Pro · 本地依赖自动检测与安装器
echo ========================================================
echo.

:: 1. 检查 Node.js
echo [1/4] 检查 Node.js 环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先前往 https://nodejs.org/ 下载并安装 Node.js LTS (18+ 或 20+)。
    goto END
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
    echo  - Node.js 就绪: %NODE_VER%
)

:: 2. 检查并安装 Node 依赖
echo.
echo [2/4] 检查并安装前端 Web 依赖包 (npm install)...
if not exist "node_modules" (
    echo  - 正在安装 npm 依赖，请稍候...
    call npm install
) else (
    echo  - node_modules 已就绪。
)

:: 3. 检查 Python 与 Python 依赖 (用于剪映与 Media Engine)
echo.
echo [3/4] 检查 Python 运行环境 (可选插件)...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo  - [提示] 未在系统 PATH 中找到 python 命令。
    echo  - 基础 Web 功能 (写稿/配音/生图/闭环动画) 可正常使用；
    echo  - 若需导出剪映草稿或母版直出，请安装 Python 3.10+ 并勾选 "Add to PATH"。
) else (
    for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
    echo  - Python 就绪: %PY_VER%
    echo  - 正在安装 Python 插件依赖 (requirements.txt)...
    python -m pip install -r requirements.txt --quiet
    echo  - Python 插件依赖已安装完成。
)

:: 4. 检查 FFmpeg 环境 (用于光流插值与 1080p 母版直出)
echo.
echo [4/4] 检查 FFmpeg 命令行工具 (用于母版直出)...
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo  - [提示] 未检测到 ffmpeg 命令。
    echo  - 若需使用 "直出 1080p 动感母版" 功能，请下载 FFmpeg 并添加到系统 PATH 环境变量。
    echo  - Windows 快速安装方法 (以管理员打开 PowerShell 执行): winget install Gyan.FFmpeg
) else (
    echo  - FFmpeg 已就绪。
)

:: 5. 配置文件初始化
echo.
if not exist "studio_config.js" (
    echo 正在从模板生成 studio_config.js 配置文件...
    copy studio_config.template.js studio_config.js >nul
)
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
    )
)

echo.
echo ========================================================
echo  ✅ 依赖检测完毕！
echo  配置好 studio_config.js 或 .env 中的百炼 Key 后，
echo  双击 start.bat 即可一键启动工作台！
echo ========================================================
echo.

:END
pause
