# Proposal Diagram Copilot

> AI 驱动的方案图转换工具 - 把不可编辑的图片/PDF 转换成可编辑的 PPTX

## 功能

- ✅ 上传图片/PDF 文件
- ✅ 自动转换为可编辑 PPTX
- ✅ 质量评分（可编辑率、OCR 准确率、布局偏差）
- ✅ 实时进度显示
- ✅ 一键下载结果

## 技术栈

- **前端**: Next.js 15 + React 19 + Tailwind CSS + Zustand
- **后端**: FastAPI + Pydantic
- **推理**: 模拟 Worker（MVP 阶段）
- **存储**: 内存（可选 Redis）

## 目录结构

```
proposal-diagram-copilot/
├── apps/
│   └── web/                    # Next.js 前端
│       ├── src/app/
│       │   ├── page.tsx        # 主页面（上传/进度/下载）
│       │   ├── layout.tsx
│       │   └── globals.css
│       ├── package.json
│       └── next.config.ts
├── services/
│   └── api/                    # FastAPI 网关
│       ├── src/main.py         # API + Worker
│       └── pyproject.toml
├── workers/
│   └── gpu-engine/             # GPU 推理（Stub）
├── packages/
│   └── shared-types/           # 共享类型定义
│       └── src/shared_types/
├── start.sh                    # 一键启动（含安装）
├── dev.sh                      # 快速启动（跳过安装）
└── README.md
```

## 快速开始

### 方式 1: 一键启动

```bash
./start.sh
```

首次运行会自动安装依赖，然后启动：
- API: http://localhost:8000
- Web: http://localhost:3000

### 方式 2: 手动启动

```bash
# 安装 Python 依赖
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

# 安装 Node.js 依赖
cd ../../apps/web
npm install

# 启动 API (终端1)
cd services/api
source .venv/bin/activate
python -m uvicorn src.main:app --reload --port 8000

# 启动 Web (终端2)
cd apps/web
npm run dev
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
返回: { asset_id, upload_url, expire_at }
```

### 上传文件
```
POST /v1/assets/upload/{asset_id}
Body: multipart/form-data (file)
```

### 创建转换任务
```
POST /v1/jobs
Body: { project_id, asset_id, output_format, template_id, options }
返回: { job_id, status }
```

### 查询任务状态
```
GET /v1/jobs/{job_id}
返回: { job_id, status, progress, stage, result?, quality? }
```

### 下载结果
```
GET /v1/jobs/{job_id}/download
返回: PPTX 文件流
```

## 开发状态

### 已完成 (MVP)
- [x] Monorepo 骨架
- [x] API 基础接口（health, assets, jobs）
- [x] 内存队列（无 Redis fallback）
- [x] 模拟 Worker（进度 + 生成示例 PPTX）
- [x] Web 上传/进度/下载闭环
- [x] 一键启动脚本

### 未完成
- [ ] 真实 GPU 推理（SAM3 + OCR + PPTX 重建）
- [ ] Redis 队列支持
- [ ] 对象存储（S3/MinIO）
- [ ] 用户鉴权（JWT）
- [ ] 模板系统
- [ ] 在线编辑器

## 下一步建议

1. **集成真实推理引擎**
   - 对接 SAM3 分割模型
   - 集成 OCR（PaddleOCR / Tesseract）
   - 实现 Drawio XML / PPTX 重建逻辑

2. **生产级改造**
   - Redis 队列（多 worker 支持）
   - Postgres 数据库（持久化）
   - S3 兼容对象存储
   - JWT 鉴权

3. **功能增强**
   - 模板系统（主题色、字体、Logo）
   - 在线编辑器（元素级修订）
   - 批量转换
   - 文本指令改图

## 许可

MIT
