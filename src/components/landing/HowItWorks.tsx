"use client";

const STEPS = [
  { step: 1, title: "输入产品", desc: "粘贴产品描述或链接，可选填品牌语音" },
  { step: 2, title: "AI 分析", desc: "自动提取卖点、受众、情感触发与差异化" },
  { step: 3, title: "获取内容包", desc: "每个平台 3 条变体，直接复制或导出" },
];

export function HowItWorks() {
  return (
    <section className="py-14">
      <h2 className="mb-2 text-center font-heading text-2xl font-semibold tracking-tight text-white">
        三步搞定
      </h2>
      <p className="mb-8 text-center text-sm text-gray-400">
        以“输入一次，平台化输出”为核心流程，减少重复劳动
      </p>
      <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-3">
        {STEPS.map(({ step, title, desc }) => (
          <div
            key={step}
            className="glass-card-hover flex flex-col items-center p-6 text-center"
          >
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-orange-400/30 bg-gradient-to-r from-orange-500/20 to-pink-500/20 font-heading text-lg font-semibold text-orange-200">
              {step}
            </span>
            <h3 className="font-heading text-sm font-semibold tracking-wide text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
