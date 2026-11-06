@echo off
title Flow Studio Pro - 环境自检与一键安装器

echo ========================================================
echo    Flow Studio Pro - 本地依赖自动检测与安装器
echo ========================================================
echo.

:: 1. 检查 Node.js
echo [1/4] 检查 Node.js 环境...
where node >nul 2>nul
if errorlevel 1 goto ERR_NODE
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo  - Node.js 就绪: %NODE_VER%
goto CHECK_NPM

:ERR_NODE
echo [错误] 未检测到 Node.js 命令。
echo 请前往 https://nodejs.org/ 下载并安装 Node.js LTS [推荐 18+ 或 20+]。
goto END

:CHECK_NPM
:: 2. 检查并安装 Node 依赖
echo.
echo [2/4] 检查并安装前端 Web 依赖包 [npm install]...
if exist "node_modules" goto NPM_DONE
echo  - 正在安装 npm 依赖，可能需要 1-3 分钟，请稍候...
call npm install
if errorlevel 1 goto ERR_NPM
:NPM_DONE
echo  - Web 前端依赖已就绪 [node_modules]。
goto CHECK_PY

:ERR_NPM
echo.
echo [警告] npm install 遇到错误，请检查网络连接或尝试使用镜像源重试。
goto CHECK_PY

:CHECK_PY
:: 3. 检查 Python 环境
echo.
echo [3/4] 检查 Python 运行环境 [可选插件]...
where python >nul 2>nul
if errorlevel 1 goto NO_PY
for /f "tokens=*" %%i in ('python --version') do set PY_VER=%%i
echo  - Python 就绪: %PY_VER%
if not exist "requirements.txt" goto CHECK_FFMPEG
echo  - 正在检查并安装 Python 插件依赖 [requirements.txt]...
python -m pip install -r requirements.txt --quiet
echo  - Python 插件依赖已安装完成。
goto CHECK_FFMPEG

:NO_PY
echo  - [提示] 未在系统 PATH 中找到 python 命令。
echo  - 基础 Web 功能 [分镜生成/配音/生图/闭环动画] 均可正常使用。
echo  - 若需导出剪映草稿或母版直出，建议安装 Python 3.10+ 并勾选 Add to PATH。
goto CHECK_FFMPEG

:CHECK_FFMPEG
:: 4. 检查 FFmpeg 环境
echo.
echo [4/4] 检查 FFmpeg 命令行工具 [用于母版直出]...
where ffmpeg >nul 2>nul
if errorlevel 1 goto NO_FFMPEG
echo  - FFmpeg 已就绪。
goto INIT_CONFIG

:NO_FFMPEG
echo  - [提示] 未检测到 ffmpeg 命令。
echo  - 若需使用 [直出 1080p 动感母版] 功能，请下载 FFmpeg 并添加到系统 PATH 环境变量。
echo  - Windows 快速安装方法: 管理员打开 PowerShell 执行 winget install Gyan.FFmpeg
goto INIT_CONFIG

:INIT_CONFIG
:: 5. 配置文件初始化
echo.
echo [配置检查] 初始化本地配置文件...
if not exist "studio_config.js" if exist "studio_config.template.js" copy studio_config.template.js studio_config.js >nul
if not exist ".env" if exist ".env.example" copy .env.example .env >nul
echo  - 配置文件已就绪 [studio_config.js / .env]。

echo.
echo ========================================================
echo  [OK] 环境检测与安装流程处理完毕！
echo  配置好 studio_config.js 或 .env 中的百炼 Key 后，
echo  双击 start.bat 即可一键启动工作台！
echo ========================================================
echo.

:END
pause
