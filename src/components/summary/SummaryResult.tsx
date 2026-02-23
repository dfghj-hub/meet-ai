"use client";

import type { SummarizeResult } from "@/lib/types";
import { useState } from "react";

interface SummaryResultProps {
  data: SummarizeResult;
  onReset: () => void;
}

export function SummaryResult({ data, onReset }: SummaryResultProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const allActionItemsText = data.actionItems
    .map(
      (item) =>
        `${item.owner} · ${item.task}${item.due ? ` · ${item.due}` : ""}`
    )
    .join("\n");

  const fullText = [
    "## 摘要",
    data.summary,
    "",
    "## 待办",
    allActionItemsText,
    "",
    "## 完整纪要",
    data.minutes,
  ].join("\n");

  const download = (ext: "txt" | "md") => {
    const blob = new Blob([fullText], {
      type: ext === "md" ? "text/markdown" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `会议纪要-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CopyIcon = () => (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
    </svg>
  );

  const CheckIcon = () => (
    <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Summary card */}
      <div className="glass-card-hover p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-xs text-indigo-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </span>
            会议摘要
          </h2>
          <button
            type="button"
            onClick={() => copy("summary", data.summary)}
            className="btn-ghost flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            {copied === "summary" ? <CheckIcon /> : <CopyIcon />}
            {copied === "summary" ? "已复制" : "复制"}
          </button>
        </div>
        <p className="text-sm leading-relaxed text-gray-300">
          {data.summary}
        </p>
      </div>

      {/* Action items card */}
      <div className="glass-card-hover p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs text-amber-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
            待办事项
          </h2>
          <button
            type="button"
            onClick={() => copy("actions", allActionItemsText)}
            className="btn-ghost flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            {copied === "actions" ? <CheckIcon /> : <CopyIcon />}
            {copied === "actions" ? "已复制" : "复制"}
          </button>
        </div>
        <div className="space-y-2">
          {data.actionItems.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
            >
              <div className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border border-surface-border" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200">{item.task}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                    {item.owner}
                  </span>
                  {item.due && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      {item.due}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Minutes card */}
      <div className="glass-card-hover p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-xs text-emerald-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </span>
            完整纪要
          </h2>
          <button
            type="button"
            onClick={() => copy("minutes", data.minutes)}
            className="btn-ghost flex items-center gap-1.5 !px-3 !py-1.5 text-xs"
          >
            {copied === "minutes" ? <CheckIcon /> : <CopyIcon />}
            {copied === "minutes" ? "已复制" : "复制"}
          </button>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">
          {data.minutes}
        </div>
      </div>

      {/* Actions bar */}
      <div className="glass-card flex flex-wrap items-center justify-between gap-3 p-4">
        <button type="button" onClick={onReset} className="btn-ghost">
          再处理一段
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => download("md")}
            className="btn-ghost flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            下载 .md
          </button>
          <button
            type="button"
            onClick={() => download("txt")}
            className="btn-ghost flex items-center gap-1.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            下载 .txt
          </button>
        </div>
      </div>
    </div>
  );
}
