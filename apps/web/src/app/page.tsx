import { useState, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface JobStatus {
  job_id: string
  status: string
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
  const [assetId, setAssetId] = useState<string | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 轮询任务状态
  useEffect(() => {
    if (!jobId) return
    
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/jobs/${jobId}`)
        const data = await res.json()
        setJobStatus(data)
        
        // 完成或失败时停止轮询
        if (data.status === 'done' || data.status === 'failed_terminal') {
          return false
        }
        return true
      } catch (e) {
        console.error('Poll error:', e)
        return true
      }
    }
    
    const interval = setInterval(async () => {
      const shouldContinue = await poll()
      if (!shouldContinue) {
        clearInterval(interval)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [jobId])

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    setError(null)
    
    try {
      // 1. 创建上传会话
      const sessionRes = await fetch(`${API_BASE}/v1/assets/upload-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'proj_demo',
          filename: file.name,
          content_type: file.type,
          size: file.size
        })
      })
      const session = await sessionRes.json()
      setAssetId(session.asset_id)
      
      // 2. 上传文件
      const formData = new FormData()
      formData.append('file', file)
      
      await fetch(`${API_BASE}/v1/assets/upload/${session.asset_id}`, {
        method: 'POST',
        body: formData
      })
      
      // 3. 创建转换任务
      const jobRes = await fetch(`${API_BASE}/v1/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'proj_demo',
          asset_id: session.asset_id,
          output_format: 'pptx',
          template_id: 'tpl_default'
        })
      })
      const job = await jobRes.json()
      setJobId(job.job_id)
      
    } catch (e: any) {
      setError(e.message || '上传失败')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = () => {
    if (!jobId) return
    window.open(`${API_BASE}/v1/jobs/${jobId}/download`, '_blank')
  }

  const handleReset = () => {
    setFile(null)
    setAssetId(null)
    setJobId(null)
    setJobStatus(null)
    setError(null)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Proposal Diagram Copilot</h1>
        <p className="text-gray-600 mb-8">上传图片/PDF，AI 自动转换为可编辑 PPTX</p>
        
        {/* 上传区域 */}
        {!jobId && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div className="text-green-600">
                    <p className="text-lg font-medium">{file.name}</p>
                    <p className="text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <p className="text-lg">点击选择文件</p>
                    <p className="text-sm">支持 PNG, JPG, PDF</p>
                  </div>
                )}
              </label>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700 transition"
            >
              {uploading ? '上传中...' : '开始转换'}
            </button>
            
            {error && (
              <p className="mt-4 text-red-600 text-center">{error}</p>
            )}
          </div>
        )}
        
        {/* 进度区域 */}
        {jobStatus && jobStatus.status !== 'done' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">转换进度</h2>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{jobStatus.stage}</span>
                <span>{jobStatus.progress}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>
            </div>
            
            <p className="text-gray-500 text-sm">任务 ID: {jobStatus.job_id}</p>
          </div>
        )}
        
        {/* 结果区域 */}
        {jobStatus && jobStatus.status === 'done' && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">转换完成!</h2>
            
            {jobStatus.result?.quality && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">质量评分</p>
                  <p className="text-2xl font-bold text-green-600">{jobStatus.result.quality.score}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">可编辑率</p>
                  <p className="text-2xl font-bold">{(jobStatus.result.quality.editable_rate * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">OCR 准确率</p>
                  <p className="text-2xl font-bold">{(jobStatus.result.quality.ocr_accuracy * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">布局偏差</p>
                  <p className="text-2xl font-bold">{(jobStatus.result.quality.layout_deviation * 100).toFixed(1)}%</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
              >
                下载 PPTX
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                重新上传
              </button>
            </div>
          </div>
        )}
        
        {/* 错误区域 */}
        {jobStatus && jobStatus.status === 'failed_terminal' && (
          <div className="bg-red-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-red-600 mb-2">转换失败</h2>
            <p className="text-red-600">{jobStatus.error_message}</p>
            <button
              onClick={handleReset}
              className="mt-4 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
            >
              重试
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
