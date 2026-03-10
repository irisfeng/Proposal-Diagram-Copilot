#!/bin/bash
# 一键启动开发环境

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Proposal Diagram Copilot..."

# 检查依赖
check_deps() {
    echo "📋 Checking dependencies..."
    
    # Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 not found. Please install Python 3.11+"
        exit 1
    fi
    
    # Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js not found. Please install Node.js 18+"
        exit 1
    fi
    
    echo "✅ Dependencies OK"
}

# 安装 Python 依赖
setup_api() {
    echo ""
    echo "📦 Setting up API server..."
    cd "$SCRIPT_DIR/services/api"
    
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    
    source .venv/bin/activate
    pip install -e . -q
    echo "✅ API dependencies installed"
}

# 安装 Node.js 依赖
setup_web() {
    echo ""
    echo "📦 Setting up Web app..."
    cd "$SCRIPT_DIR/apps/web"
    
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    echo "✅ Web dependencies installed"
}

# 启动服务
start_services() {
    echo ""
    echo "🔄 Starting services..."
    
    # 启动 API (后台)
    cd "$SCRIPT_DIR/services/api"
    source .venv/bin/activate
    echo "  → Starting API on http://localhost:8000"
    python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 &
    API_PID=$!
    
    # 等待 API 启动
    sleep 2
    
    # 启动 Web
    cd "$SCRIPT_DIR/apps/web"
    echo "  → Starting Web on http://localhost:3000"
    npm run dev &
    WEB_PID=$!
    
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "📱 Open http://localhost:3000 in your browser"
    echo "📚 API docs: http://localhost:8000/docs"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""
    
    # 等待任一进程结束
    trap "kill $API_PID $WEB_PID 2>/dev/null; exit 0" INT TERM
    wait
}

# 主流程
check_deps
setup_api
setup_web
start_services
