#!/bin/bash
# Proposal Diagram Copilot - 一键启动脚本

set -e
cd "$(dirname "$0")"

echo "🚀 启动 Proposal Diagram Copilot..."
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 需要 Python 3.11+"
    exit 1
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 需要 Node.js 18+"
    exit 1
fi

# 创建虚拟环境（如果不存在）
if [ ! -d ".venv" ]; then
    echo "📦 创建 Python 虚拟环境..."
    python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

# 1. 安装 Python 依赖
echo "📦 安装 Python 依赖..."
pip install -q -e packages/shared-types 2>/dev/null || true
pip install -q -e services/api 2>/dev/null || true

echo "🔧 启动 API 服务 (端口 8000)..."
python3 services/api/src/main.py &
API_PID=$!
echo "   PID: $API_PID"

# 等待 API 启动
sleep 3

# 2. 启动 Web
echo ""
echo "📦 安装 Node.js 依赖..."
cd apps/web
npm install --silent 2>/dev/null || true
cd ../..

echo "🌐 启动 Web 服务 (端口 3000)..."
cd apps/web
npm run dev &
WEB_PID=$!
cd ../..

echo ""
echo "✅ 服务已启动!"
echo ""
echo "   API:  http://localhost:8000/docs"
echo "   Web:  http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 清理函数
cleanup() {
    echo ""
    echo "🛑 停止服务..."
    kill $API_PID 2>/dev/null || true
    kill $WEB_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# 等待任意子进程退出
wait
