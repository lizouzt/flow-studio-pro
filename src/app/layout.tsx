import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flow Studio Pro · 电影工业级真实视频流工作台',
  description: '从选题文案、AI语音合成、ASR对齐、电影级首帧渲染、I2V视频动力学到剪映专业版草稿的一站式电影级工作台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="bg-brand-black min-h-screen text-gray-200 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
