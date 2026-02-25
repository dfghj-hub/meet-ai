"use client";

import { useState } from "react";
import type { CopyVariant } from "@/lib/types";

interface CopyVariantCardProps {
  variant: CopyVariant;
}

export function CopyVariantCard({ variant }: CopyVariantCardProps) {
  const [copied, setCopied] = useState(false);

  const fullText = [variant.title, variant.hook, variant.body, variant.cta, variant.tags.join(" ")].filter(Boolean).join("\n\n");

  async function copyFull() {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <div className="glass-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded bg-orange-500/20 px-2 py-0.5 font-heading text-xs font-semibold text-orange-300">
          变体 {variant.id}
        </span>
        <span className="text-xs text-gray-500">
          互动预估 {variant.engagementScore} · {variant.postingTime}
        </span>
      </div>
      <h4 className="mb-2 font-medium text-white">{variant.title}</h4>
      <p className="whitespace-pre-wrap text-sm text-gray-400">{variant.body}</p>
      <div className="mt-2 flex flex-wrap gap-1 text-xs text-gray-500">
        {variant.tags.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <button
        type="button"
        onClick={copyFull}
        className="mt-3 w-full rounded-lg border border-surface-border bg-surface py-2 text-sm font-medium text-gray-300 hover:bg-surface-hover hover:text-white"
      >
        {copied ? "已复制" : "一键复制全文"}
      </button>
    </div>
  );
}
