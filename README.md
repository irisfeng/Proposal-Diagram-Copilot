# Proposal Diagram Copilot

AI 驱动的方案图转换 MVP：把不可编辑图片/PDF，转成可编辑 PPTX。

## 在线演示能力（当前 MVP）

- 上传图片/PDF
- 创建转换任务
- 实时查看任务阶段与进度
- 返回质量评分（可编辑率 / OCR 准确率 / 布局偏差）
- 下载示例 PPTX

> 当前为 MVP：转换流程与任务系统完整可跑，推理部分为 stub worker（用于验证端到端链路）。

---

## 技术架构

- **Web**: Next.js 15 + React 19 + Tailwind
- **API**: FastAPI + Pydantic
- **Worker**: 内置模拟 pipeline（可替换为真实 GPU Worker）
- **Queue**: 内存队列（后续可切 Redis）

目录结构：

```bash
proposal-diagram-copilot/
├─ apps/
│  └─ web/                  # 前端（上传/进度/下载）
├─ services/
│  └─ api/                  # 后端 API + 任务编排
├─ workers/
│  └─ gpu-engine/           # 预留 GPU 推理服务
├─ packages/
│  └─ shared-types/         # 共享类型
├─ start.sh                 # 一键安装+启动
├─ dev.sh                   # 快速启动
└─ README.md
```

---

## 快速启动

### 方式 1（推荐）：一键启动

```bash
./start.sh
```

默认会启动：
- API: `http://localhost:8000`
- API 文档: `http://localhost:8000/docs`
- Web: `http://localhost:3000`

### 方式 2：开发模式快速启动

```bash
./dev.sh
```

> 若 3000 端口被占用，Next.js 会自动切到 3001。

---

## 本地手动启动

```bash
# 1) API 依赖
cd services/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .

# 2) Web 依赖
cd ../../apps/web
npm install

# 3) 启动 API (终端 A)
cd ../../services/api
source .venv/bin/activate
python -m uvicorn src.main:app --reload --port 8000

# 4) 启动 Web (终端 B)
cd ../../apps/web
npm run dev
```

---

## API 一览

- `GET /v1/health` 健康检查
- `POST /v1/assets/upload-session` 创建上传会话
- `POST /v1/assets/upload/{asset_id}` 上传文件
- `POST /v1/jobs` 创建任务
- `GET /v1/jobs/{job_id}` 查询任务状态
- `GET /v1/jobs/{job_id}/result` 查询结果信息
- `GET /v1/jobs/{job_id}/download` 下载 PPTX

---

## MVP 状态

### 已完成
- Monorepo 基础结构
- 端到端任务链路（上传 -> 入队 -> 处理 -> 下载）
- 任务状态机与进度回传
- 质量评分字段输出
- Web 基础交互页

### 待增强（V1）
- 接入真实推理：SAM3 + OCR + 结构重建
- Redis 队列与多 worker
- 对象存储（S3/MinIO）
- 用户鉴权与组织权限
- 模板系统（企业主题）
- 在线编辑器

---

## 版本标记

- `v0.1.0-mvp`: 首个可运行 MVP 里程碑版本

---

## License

MIT
