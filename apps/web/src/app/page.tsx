'use client'

import { useState, useCallback } from 'react'
import { Upload, FileImage, Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type JobStatus = 'queued' | 'preprocessing' | 'inferencing' | 'reconstructing' | 'scoring' | 'done' | 'failed_retryable' | 'failed_terminal'

interface JobInfo {
  job_id: string
  status: JobStatus
  progress: number
  stage: string
  result?: {
    output_url: string
    preview_url: string
    quality?: {
      editable_rate: number
      ocr_accuracy: number
      layout_deviation: number
      score: number
    }
  }
  error_message?: string
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [job, setJob] = useState<JobInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setError(null)
      setJob(null)
    }
  }

  const pollJobStatus = useCallback(async (jobId: string) => {
    const poll = async (): Promise<JobInfo> => {
      const res = await fetch(`${API_URL}/v1/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch job status')
      return res.json()
    }

    let jobInfo = await poll()
    setJob(jobInfo)

    while (jobInfo.status !== 'done' && !jobInfo.status.startsWith('failed')) {
      await new Promise(r => setTimeout(r, 1000))
      jobInfo = await poll()
      setJob(jobInfo)
    }

    return jobInfo
  }, [])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setJob(null)

    try {
      // 1. 创建上传会话
      const sessionRes = await fetch(`${API_URL}/v1/assets/upload-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'p_default',
          filename: file.name,
          content_type: file.type,
          size: file.size,
        }),
      })
      if (!sessionRes.ok) throw new Error('Failed to create upload session')
      const { asset_id } = await sessionRes.json()

      // 2. 上传文件
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch(`${API_URL}/v1/assets/upload/${asset_id}`, {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file')

      // 3. 创建任务
      const jobRes = await fetch(`${API_URL}/v1/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'p_default',
          asset_id,
          output_format: 'pptx',
          template_id: 'tpl_default',
        }),
      })
      if (!jobRes.ok) throw new Error('Failed to create job')
      const { job_id } = await jobRes.json()

      // 4. 轮询状态
      await pollJobStatus(job_id)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!job) return
    window.open(`${API_URL}/v1/jobs/${job.job_id}/download`, '_blank')
  }

  const getStatusColor = (status: JobStatus) => {
    if (status === 'done') return 'text-green-600'
    if (status.startsWith('failed')) return 'text-red-600'
    return 'text-blue-600'
  }

  const getStatusIcon = (status: JobStatus) => {
    if (status === 'done') return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status.startsWith('failed')) return <AlertCircle className="w-5 h-5 text-red-600" />
    return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Proposal Diagram Copilot
        </h1>
        <p className="text-gray-600 mb-8">
          上传架构图 / 流程图，AI 自动转换为可编辑 PPTX
        </p>

        {/* 上传区域 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {file ? file.name : '点击或拖拽上传图片 / PDF'}
              </p>
              <p className="text-sm text-gray-400">
                支持 PNG, JPG, PDF
              </p>
            </label>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                处理中...
              </span>
            ) : (
              '开始转换'
            )}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* 任务状态 */}
        {job && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon(job.status)}
              <span className={`font-medium capitalize ${getStatusColor(job.status)}`}>
                {job.stage} ({job.progress}%)
              </span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${job.progress}%` }}
              />
            </div>

            {/* 质量评分 */}
            {job.result?.quality && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">质量评分</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">可编辑率</span>
                    <span className="float-right font-medium">{(job.result.quality.editable_rate * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">OCR 准确率</span>
                    <span className="float-right font-medium">{(job.result.quality.ocr_accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">布局偏差</span>
                    <span className="float-right font-medium">{(job.result.quality.layout_deviation * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">综合评分</span>
                    <span className="float-right font-bold text-lg text-blue-600">{job.result.quality.score}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 下载按钮 */}
            {job.status === 'done' && (
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载 PPTX
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
