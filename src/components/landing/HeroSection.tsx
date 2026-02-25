"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative text-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-1/3 h-40 w-40 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute -right-12 top-1/4 h-48 w-48 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-4 py-1.5 text-xs tracking-wide text-gray-400 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          AI Social Commerce Content Engine
        </div>

        <h1 className="font-heading text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
          输入产品，
          <span className="bg-gradient-to-r from-orange-300 to-pink-400 bg-clip-text text-transparent">
            一键生成多平台内容包
          </span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-400 md:text-lg">
          面向小红书、抖音、微信视频号、B站、快手，自动给出平台化文案、可验证依据和执行动作。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/generate" className="btn-primary inline-block min-w-[180px]">
            立即开始生成
          </Link>
          <Link
            href="/brand"
            className="btn-ghost inline-block min-w-[180px] text-center"
          >
            配置品牌语音
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500">
          <span className="rounded-full border border-surface-border px-3 py-1">多品牌档案</span>
          <span className="rounded-full border border-surface-border px-3 py-1">历史复用</span>
          <span className="rounded-full border border-surface-border px-3 py-1">发布策略可控</span>
        </div>
      </div>
    </section>
  );
}
