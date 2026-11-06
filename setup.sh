#!/usr/bin/env bash

# ==============================================================================
# Flow Studio Pro - 环境自检与一键安装器 (macOS / Linux)
# ==============================================================================

set -e

# 颜色常量
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}========================================================${NC}"
echo -e "${BOLD}${YELLOW}   🎬 Flow Studio Pro · 本地依赖自动检测与安装器${NC}"
echo -e "${BOLD}${CYAN}========================================================${NC}"
echo ""

# 1. 检查 Node.js
echo -e "${BOLD}[1/4] 检查 Node.js 环境...${NC}"
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}[错误] 未检测到 Node.js！${NC}"
    echo -e "请先安装 Node.js LTS (18+ 或 20+):"
    echo -e " - macOS (Homebrew): ${CYAN}brew install node${NC}"
    echo -e " - Ubuntu/Debian:    ${CYAN}sudo apt install nodejs npm${NC} 或通过 nvm 安装"
    exit 1
else
    NODE_VER=$(node -v)
    echo -e " - Node.js 就绪: ${GREEN}${NODE_VER}${NC}"
fi

# 2. 安装前端 Web 依赖包 (npm install)
echo ""
echo -e "${BOLD}[2/4] 检查并安装前端 Web 依赖包 (npm install)...${NC}"
if [ ! -d "node_modules" ]; then
    echo " - 正在安装 npm 依赖，请稍候..."
    npm install
else
    echo -e " - node_modules 已就绪: ${GREEN}OK${NC}"
fi

# 3. 检查 Python 环境与依赖
echo ""
echo -e "${BOLD}[3/4] 检查 Python 运行环境 (可选插件)...${NC}"
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
fi

if [ -z "$PYTHON_BIN" ]; then
    echo -e " - ${YELLOW}[提示] 未检测到 python 命令。${NC}"
    echo " - 基础 Web 功能 (写稿/配音/生图/闭环动画) 可正常使用；"
    echo " - 若需导出剪映草稿或使用母版直出，请安装 Python 3.10+。"
else
    PY_VER=$($PYTHON_BIN --version)
    echo -e " - Python 就绪: ${GREEN}${PY_VER}${NC} (使用命令: ${PYTHON_BIN})"
    if [ -f "requirements.txt" ]; then
        echo " - 正在安装 Python 扩展依赖 (requirements.txt)..."
        $PYTHON_BIN -m pip install -r requirements.txt --quiet || {
            echo -e " - ${YELLOW}[提示] pip 安装可能遇到权限或虚拟环境限制，可手动执行：pip install -r requirements.txt${NC}"
        }
        echo -e " - Python 插件依赖处理完成: ${GREEN}OK${NC}"
    fi
fi

# 4. 检查 FFmpeg 环境
echo ""
echo -e "${BOLD}[4/4] 检查 FFmpeg 命令行工具 (用于母版直出)...${NC}"
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo -e " - ${YELLOW}[提示] 未检测到 ffmpeg 命令。${NC}"
    echo " - 若需使用 '直出 1080p 动感母版' 功能，请安装 FFmpeg:"
    echo -e " - macOS:         ${CYAN}brew install ffmpeg${NC}"
    echo -e " - Ubuntu/Debian: ${CYAN}sudo apt install ffmpeg${NC}"
else
    echo -e " - FFmpeg 已就绪: ${GREEN}OK${NC}"
fi

# 5. 初始化配置文件
echo ""
if [ ! -f "studio_config.js" ] && [ -f "studio_config.template.js" ]; then
    echo "正在从模板生成 studio_config.js 配置文件..."
    cp studio_config.template.js studio_config.js
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "正在从模板生成 .env 环境变量文件..."
    cp .env.example .env
fi

# 赋予 start.sh / setup.sh 可执行权限
chmod +x setup.sh 2>/dev/null || true
if [ -f "start.sh" ]; then
    chmod +x start.sh 2>/dev/null || true
fi

echo ""
echo -e "${BOLD}${GREEN}========================================================${NC}"
echo -e "${BOLD}${GREEN}  ✅ 依赖检测完毕！${NC}"
echo -e "  配置好 .env 或 studio_config.js 中的百炼 Key 后，"
echo -e "  运行 ${CYAN}npm run dev${NC} 或 ${CYAN}./start.sh${NC} 即可启动工作台！"
echo -e "${BOLD}${GREEN}========================================================${NC}"
echo ""
