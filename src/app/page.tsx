"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { InputTabs } from "@/components/InputTabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SummaryResult } from "@/components/summary/SummaryResult";
import type { SummarizeResult } from "@/lib/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummarizeResult | null>(null);

  const handleTextSubmit = async (text: string) => {
    setError(null);
    if (!text) {
      setError("请粘贴会议记录或转写稿");
      return;
    }
    setLoading(true);
    setLoadingStage("AI 正在分析文字稿…");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "请求失败");
        return;
      }
      setResult(data as SummarizeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const handleAudioSubmit = async (file: File) => {
    setError(null);
    setLoading(true);
    setLoadingStage("上传音频中…");
    try {
      const formData = new FormData();
      formData.set("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setError(uploadData?.error ?? "上传失败");
        return;
      }
      setLoadingStage("AI 正在转写和生成纪要…");
      const processRes = await fetch("/api/process-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioUrl: uploadData.url }),
      });
      const processData = await processRes.json();
      if (!processRes.ok) {
        setError(processData?.error ?? "处理失败");
        return;
      }
      setResult(processData as SummarizeResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "网络错误");
    } finally {
      setLoading(false);
      setLoadingStage(null);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <>
      <Header />

      {/* Background glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-36 top-1/4 h-[30rem] w-[30rem] rounded-full bg-indigo-600/30 blur-[130px] animate-float-slow" />
        <div className="absolute -right-36 top-1/2 h-[26rem] w-[26rem] rounded-full bg-purple-600/22 blur-[115px] animate-float-slower" />
        <div className="absolute -bottom-8 left-1/3 h-72 w-72 rounded-full bg-blue-600/16 blur-[90px] animate-float-slow" />
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-24">
        {/* Hero */}
        {!result && !loading && (
          <div className="mb-7 text-center animate-slide-up">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white md:text-4xl">
              AI 会议纪要，
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                一键搞定
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-400">
              粘贴文字稿或上传会议录音，AI 自动提取摘要、待办事项和完整纪要。
              专业、快速、安全。
            </p>

            {/* Stats */}
            <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-4">
              {[
                { value: "<30s", label: "生成速度" },
                { value: "99%", label: "准确率" },
                { value: "0", label: "数据留存" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card px-4 py-3">
                  <p className="font-heading text-lg font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        {loading ? (
          <LoadingSpinner stage={loadingStage} />
        ) : result ? (
          <SummaryResult data={result} onReset={reset} />
        ) : (
          <InputTabs
            onTextSubmit={handleTextSubmit}
            onAudioSubmit={handleAudioSubmit}
            loading={loading}
            loadingStage={loadingStage}
            error={error}
          />
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-surface-border pt-6 text-center">
          <p className="text-xs text-gray-600">
            录音仅用于生成纪要，处理完成后自动删除，不在服务器长期保存。
          </p>
          <p className="mt-1 text-xs text-gray-700">
            Powered by DeepSeek &middot; MeetAI
          </p>
        </footer>
      </main>
    </>
  );
}
