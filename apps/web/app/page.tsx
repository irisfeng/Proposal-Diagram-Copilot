"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, FileImage, Loader2, CheckCircle, XCircle, Download, RefreshCw } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type JobStatus = "queued" | "preprocessing" | "inferencing" | "reconstructing" | "scoring" | "done" | "failed_retryable" | "failed_terminal";

interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  stage: string;
  result?: {
    output_url: string;
    preview_url: string;
    quality?: {
      editable_rate: number;
      ocr_accuracy: number;
      layout_deviation: number;
      score: number;
    };
  };
  quality?: {
    editable_rate: number;
    ocr_accuracy: number;
    layout_deviation: number;
    score: number;
  };
  error_message?: string;
}

const STAGE_LABELS: Record<string, string> = {
  queued: "排队中",
  preprocessing: "预处理",
  inferencing: "AI 推理",
  reconstructing: "重建文档",
  scoring: "质量评分",
  done: "完成",
  failed_retryable: "失败(可重试)",
  failed_terminal: "失败",
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 轮询任务状态
  useEffect(() => {
    if (!jobId || !jobStatus) return;
    if (jobStatus.status === "done" || jobStatus.status === "failed_terminal") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/jobs/${jobId}`);
        if (res.ok) {
          const data: JobStatusResponse = await res.json();
          setJobStatus(data);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setJobId(null);
      setJobStatus(null);
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. 创建上传会话
      const sessionRes = await fetch(`${API_BASE}/v1/assets/upload-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "default",
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      });

      if (!sessionRes.ok) throw new Error("创建上传会话失败");
      const session = await sessionRes.json();

      // 2. 上传文件
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(`${API_BASE}/v1/assets/upload/${session.asset_id}`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("上传文件失败");

      // 3. 创建任务
      const jobRes = await fetch(`${API_BASE}/v1/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: "default",
          asset_id: session.asset_id,
          output_format: "pptx",
        }),
      });

      if (!jobRes.ok) throw new Error("创建任务失败");
      const job = await jobRes.json();
      setJobId(job.job_id);

      // 4. 获取初始状态
      const statusRes = await fetch(`${API_BASE}/v1/jobs/${job.job_id}`);
      if (statusRes.ok) {
        setJobStatus(await statusRes.json());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }, [file]);

  const handleDownload = async () => {
    if (!jobId) return;
    window.open(`${API_BASE}/v1/jobs/${jobId}/download`, "_blank");
  };

  const handleReset = () => {
    setFile(null);
    setJobId(null);
    setJobStatus(null);
    setError(null);
  };

  const getStatusIcon = () => {
    if (!jobStatus) return null;
    switch (jobStatus.status) {
      case "done":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed_terminal":
      case "failed_retryable":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      {!jobId && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">上传方案图</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileImage className="w-8 h-8 text-blue-500" />
                  <span className="text-gray-700">{file.name}</span>
                  <span className="text-gray-400 text-sm">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>点击选择图片或 PDF 文件</p>
                  <p className="text-sm mt-1">支持 PNG, JPG, PDF 格式</p>
                </div>
              )}
            </label>
          </div>

          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary mt-4 w-full flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  开始转换
                </>
              )}
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* 任务状态 */}
      {jobStatus && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">转换状态</h2>
            <button onClick={handleReset} className="btn-secondary text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              重新开始
            </button>
          </div>

          <div className="space-y-4">
            {/* 状态行 */}
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-medium">
                {STAGE_LABELS[jobStatus.stage] || jobStatus.stage}
              </span>
              <span className="text-gray-500 ml-auto">{jobStatus.progress}%</span>
            </div>

            {/* 进度条 */}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${jobStatus.progress}%` }}
              />
            </div>

            {/* 任务 ID */}
            <div className="text-sm text-gray-500">
              任务 ID: <code className="bg-gray-100 px-1 rounded">{jobId}</code>
            </div>

            {/* 错误信息 */}
            {jobStatus.error_message && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                错误: {jobStatus.error_message}
              </div>
            )}

            {/* 完成结果 */}
            {jobStatus.status === "done" && jobStatus.quality && (
              <div className="mt-4 space-y-4">
                {/* 质量评分 */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">
                    质量评分: {jobStatus.quality.score} 分
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">可编辑率</span>
                      <p className="font-medium">{(jobStatus.quality.editable_rate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">OCR 准确率</span>
                      <p className="font-medium">{(jobStatus.quality.ocr_accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-gray-500">布局偏差</span>
                      <p className="font-medium">{(jobStatus.quality.layout_deviation * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* 下载按钮 */}
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载 PPTX 文件
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="card bg-gray-50">
        <h3 className="font-medium mb-2">使用说明</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>上传包含系统架构图、流程图或方案图的图片/PDF</li>
          <li>AI 将自动识别图中的元素和关系</li>
          <li>生成可编辑的 PPTX 文件，包含完整的架构图</li>
          <li>下载后可在 PowerPoint 或 WPS 中继续编辑</li>
        </ol>
      </div>
    </div>
  );
}
