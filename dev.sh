#!/bin/bash
# 快速启动（跳过安装）

cd "$(dirname "$0")"

echo "🚀 启动 Proposal Diagram Copilot..."

# 启动 API (后台)
cd services/api
source .venv/bin/activate 2>/dev/null || true
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 &
cd ../..

sleep 2

# 启动 Web
cd apps/web
npm run dev
