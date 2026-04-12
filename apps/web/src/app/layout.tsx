import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '处方审查助手',
  description: '处方随机审查管理系统',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  )
}
