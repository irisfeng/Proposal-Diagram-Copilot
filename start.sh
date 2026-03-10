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

# 1. 启动 API
echo "📦 安装 Python 依赖..."
cd services/api
pip install -q -e ../../packages/shared-types
pip install -q -e .
cd ../..

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
npm install --silent
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

# 等待任意子进程退出
wait
