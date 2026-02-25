import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a12",
};

export const metadata: Metadata = {
  title: "SellBoost — AI 社交电商内容引擎",
  description:
    "输入产品信息，一键生成小红书、抖音、微信视频号、B站、快手全平台带货内容包。",
  openGraph: {
    title: "SellBoost — AI 社交电商内容引擎",
    description: "输入产品信息，一键生成小红书、抖音、微信视频号、B站、快手全平台带货内容包。",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: "SellBoost — AI 社交电商内容引擎",
    description: "输入产品信息，一键生成全平台带货内容包。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen antialiased">
        <Header />
        {children}
      </body>
    </html>
  );
}
