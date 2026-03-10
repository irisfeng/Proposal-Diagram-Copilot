# GPU Engine Worker (Stub)

这是 GPU 推理 worker 的占位目录。

## 功能

- SAM3 分割
- OCR 文字识别
- Drawio XML / PPTX 重建
- 质量评分

## 当前状态

MVP 阶段，推理逻辑已内联到 API 服务中 (`services/api/src/main.py` 的 `run_worker` 函数)。

## 后续开发

1. 将推理逻辑迁移到独立进程
2. 通过 Redis 队列与 API 通信
3. 支持 GPU 加速
