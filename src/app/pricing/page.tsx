"use client";

const PLANS = [
  {
    name: "免费版",
    price: "¥0",
    period: "永久",
    desc: "体验核心能力",
    features: ["每天 3 次生成", "2 个平台（小红书 + 抖音）", "基础品牌语音"],
    cta: "免费开始",
    href: "/generate",
    highlight: false,
  },
  {
    name: "Pro",
    price: "¥49",
    period: "/月",
    desc: "适合个人与小微团队",
    features: [
      "无限生成",
      "全 5 平台",
      "高级品牌语音 + 成功案例学习",
      "A/B/C 三变体 + 互动预测分",
      "历史内容包保存",
    ],
    cta: "即将开放",
    href: "#",
    highlight: true,
  },
  {
    name: "团队版",
    price: "¥149",
    period: "/月",
    desc: "多品牌与协作",
    features: [
      "Pro 全部权益",
      "多品牌管理",
      "团队成员协作",
      "批量生成",
      "数据分析看板",
    ],
    cta: "即将开放",
    href: "#",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="relative z-10 mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-gray-500">Pricing</p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-white">
          定价
        </h1>
        <p className="mt-2 text-gray-400">
        当前为免费体验阶段，Pro 与团队版即将开放。
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`glass-card-hover relative flex flex-col rounded-2xl p-6 ${
              plan.highlight ? "ring-1 ring-orange-400/60" : ""
            }`}
          >
            {plan.highlight && (
              <span className="mb-3 inline-block w-fit rounded-full border border-orange-400/40 bg-orange-500/12 px-3 py-0.5 text-xs font-semibold text-orange-300">
                推荐
              </span>
            )}
            <h2 className="font-heading text-lg font-semibold tracking-wide text-white">
              {plan.name}
            </h2>
            <p className="mt-1 text-sm text-gray-400">{plan.desc}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-heading text-3xl font-bold text-white">
                {plan.price}
              </span>
              <span className="text-gray-500">{plan.period}</span>
            </div>
            <ul className="mt-6 flex-1 space-y-2 text-sm leading-relaxed text-gray-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500/60" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href={plan.href}
              className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors ${
                plan.highlight
                  ? "btn-primary"
                  : "border border-surface-border bg-surface text-gray-300 hover:bg-surface-hover hover:text-white"
              }`}
            >
              {plan.cta}
            </a>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-surface-border bg-surface/60 p-4 text-center text-xs text-gray-500">
        当前阶段优先验证产品价值与转化路径，支付系统将在验证通过后接入。
      </div>
    </main>
  );
}
