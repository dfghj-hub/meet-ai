import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetAI — AI 会议纪要助手",
  description:
    "上传会议录音或粘贴文字稿，AI 自动生成摘要、待办事项和可复制的会议纪要",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
