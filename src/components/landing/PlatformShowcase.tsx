"use client";

import { PLATFORM_RULES } from "@/lib/platforms";
import type { PlatformId } from "@/lib/platforms";

const ORDER: PlatformId[] = ["xiaohongshu", "douyin", "wechat", "bilibili", "kuaishou"];

export function PlatformShowcase() {
  return (
    <section className="py-12">
      <h2 className="mb-2 text-center font-heading text-2xl font-semibold tracking-tight text-white">
        支持平台
      </h2>
      <p className="mb-7 text-center text-sm text-gray-400">
        同一产品，一次生成即可覆盖主流内容平台
      </p>
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
        {ORDER.map((id) => {
          const r = PLATFORM_RULES[id];
          return (
            <div
              key={id}
              className="glass-card-hover flex items-center gap-3 rounded-xl px-5 py-3"
            >
              <span className="text-2xl">{r.icon}</span>
              <span className="text-sm font-medium text-white">{r.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
