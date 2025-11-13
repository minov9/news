import type { Metadata } from 'next'
import './globals.css'
import { ThemeToggle } from '@/components/theme-toggle'

export const metadata: Metadata = {
  title: 'Daily AI News',
  description: '每日AI新闻自动化网站，智能总结AI相关资讯',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        {children}
        <ThemeToggle />
      </body>
    </html>
  )
}
