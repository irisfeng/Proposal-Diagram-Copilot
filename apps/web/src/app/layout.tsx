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
    <html lang="zh">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
