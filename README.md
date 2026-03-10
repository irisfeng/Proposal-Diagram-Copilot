# Proposal Diagram Copilot

AI 驱动的方案图转换工具 - 将架构图、流程图转换为可编辑的 PPTX 文件。

## 功能

- 📤 上传图片或 PDF 文件
- 🤖 AI 自动识别图中的元素和关系
- 📊 生成可编辑的 PPTX 文件
- 📈 质量评分系统

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+

### 一键启动

```bash
./dev.sh
```

这将自动：
1. 检查依赖
2. 安装 Python 和 Node.js 包
3. 启动 API 服务 (端口 8000)
4. 启动 Web 应用 (端口 3000)

### 访问地址

- **Web 界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/docs

## 项目结构

```
proposal-diagram-copilot/
├── apps/
│   └── web/                    # Next.js 前端
│       ├── app/
│       │   ├── layout.tsx      # 布局
│       │   ├── page.tsx        # 主页面
│       │   └── globals.css     # 样式
│       └── package.json
├── services/
│   └── api/                    # FastAPI 后端
│       ├── src/
│       │   └── main.py         # API 服务 (含内联 Worker)
│       └── pyproject.toml
├── packages/
│   └── shared-types/           # 共享类型定义
│       └── src/shared_types/
└── workers/
    └── gpu-engine/             # GPU Worker (MVP 阶段已内联到 API)
```

## API 接口

### 健康检查
```
GET /v1/health
```

### 创建上传会话
```
POST /v1/assets/upload-session
Body: { project_id, filename, content_type, size }
```

### 上传文件
```
POST /v1/assets/upload/{asset_id}
Body: multipart/form-data (file)
```

### 创建转换任务
```
POST /v1/jobs
Body: { project_id, asset_id, output_format }
```

### 查询任务状态
```
GET /v1/jobs/{job_id}
```

### 下载结果
```
GET /v1/jobs/{job_id}/download
```

## 工作流程

1. **上传** - 用户上传图片/PDF
2. **预处理** - 图像增强、格式转换
3. **AI 推理** - SAM3 分割、OCR 文字识别
4. **重建** - 生成 PPTX/DRAWIO 格式
5. **评分** - 质量评估
6. **下载** - 用户下载结果

## 开发说明

### 前端开发

```bash
cd apps/web
npm install
npm run dev
```

### 后端开发

```bash
cd services/api
python -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn src.main:app --reload
```

## MVP 状态

✅ 基础上传功能
✅ 任务状态轮询
✅ 进度展示
✅ 示例 PPTX 生成
✅ 质量评分 (模拟)
✅ 文件下载

## 后续开发

- [ ] 集成真实 GPU 推理
- [ ] Redis 队列支持
- [ ] 多模板支持
- [ ] 批量处理
- [ ] 用户认证

## License

MIT
