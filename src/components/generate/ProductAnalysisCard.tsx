"use client";

import { useState } from "react";
import type { AnalyzedProduct } from "@/lib/types";

interface ProductAnalysisCardProps {
  product: AnalyzedProduct;
}

export function ProductAnalysisCard({ product }: ProductAnalysisCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="glass-card overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left hover:bg-surface-hover"
        onClick={() => setOpen((o) => !o)}
      >
        <h3 className="font-heading text-base font-semibold text-white">
          产品分析摘要
        </h3>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-surface-border p-4 pt-2">
          <p className="mb-3 text-sm text-gray-300">{product.summary}</p>
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-orange-300">核心卖点</p>
              <ul className="list-inside list-disc text-gray-400">
                {product.usps.slice(0, 4).map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-pink-300">情感触发</p>
              <p className="text-gray-400">{product.emotionalTriggers.join("、")}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
