import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Proposal Diagram Copilot",
  description: "AI 驱动的方案图转换工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">
              🎨 Proposal Diagram Copilot
            </h1>
            <p className="text-sm text-gray-500">AI 驱动的方案图转换工具</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
