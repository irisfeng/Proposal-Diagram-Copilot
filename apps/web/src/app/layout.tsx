import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Proposal Diagram Copilot',
  description: 'AI-powered diagram to PPTX converter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
