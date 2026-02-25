"use client";

import { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PlatformSelector } from "@/components/generate/PlatformSelector";
import { ProductAnalysisCard } from "@/components/generate/ProductAnalysisCard";
import { PlatformResultTabs } from "@/components/generate/PlatformResultTabs";
import { VerifiedResultCard } from "@/components/flow/VerifiedResultCard";
import { FlowFeedback } from "@/components/flow/FlowFeedback";
import { trackEvent } from "@/lib/analytics";
import {
  getActiveStyleProfile,
  hasStyleProfile,
  loadStyleProfileListFromStorage,
} from "@/lib/style-profile";
import type { AnalyzedProduct, SellingPack } from "@/lib/types";
import type { PlatformId } from "@/lib/platforms";
import type { StyleProfileRecord } from "@/lib/style-profile";

const FLOW_NAME = "generate";
const GENERATE_HISTORY_KEY = "sellboost_generate_history_v1";
const MAX_HISTORY_ITEMS = 20;

interface GenerateHistoryItem {
  id: string;
  createdAt: string;
  productText: string;
  productUrl: string;
  platforms: PlatformId[];
  useBrandVoice: boolean;
  brandProfileId: string | null;
  publishMode: "image_text" | "spoken" | "review";
  conversionGoal: "awareness" | "engagement" | "leads" | "sales";
  focusAngle: string;
  pack: SellingPack;
}

export default function GeneratePage() {
  const [step, setStep] = useState<"input" | "loading" | "result">("input");
  const [productText, setProductText] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [platforms, setPlatforms] = useState<PlatformId[]>(["xiaohongshu", "douyin"]);
  const [useBrandVoice, setUseBrandVoice] = useState(false);
  const [pack, setPack] = useState<SellingPack | null>(null);
  const [error, setError] = useState("");
  const [hasBrandVoice, setHasBrandVoice] = useState(false);
  const [brandProfiles, setBrandProfiles] = useState<StyleProfileRecord[]>([]);
  const [selectedBrandProfileId, setSelectedBrandProfileId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<GenerateHistoryItem[]>([]);
  const [publishMode, setPublishMode] = useState<"image_text" | "spoken" | "review">("image_text");
  const [conversionGoal, setConversionGoal] = useState<"awareness" | "engagement" | "leads" | "sales">("awareness");
  const [focusAngle, setFocusAngle] = useState("");

  useEffect(() => {
    try {
      const { profiles, activeId } = loadStyleProfileListFromStorage(window.localStorage);
      setBrandProfiles(profiles);
      setSelectedBrandProfileId(activeId);
      const active = getActiveStyleProfile(profiles, activeId);
      setHasBrandVoice(active ? hasStyleProfile(active.profile) : false);
    } catch {
      setHasBrandVoice(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(GENERATE_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return;
      const records = parsed
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const o = item as Record<string, unknown>;
          if (!o.pack || typeof o.pack !== "object") return null;
          const platformsFromHistory = Array.isArray(o.platforms)
            ? (o.platforms as unknown[]).filter(
                (p): p is PlatformId =>
                  typeof p === "string" &&
                  ["xiaohongshu", "douyin", "wechat", "bilibili", "kuaishou"].includes(p)
              )
            : ["xiaohongshu", "douyin"];
          return {
            id: typeof o.id === "string" ? o.id : `${Date.now()}_${Math.random()}`,
            createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
            productText: typeof o.productText === "string" ? o.productText : "",
            productUrl: typeof o.productUrl === "string" ? o.productUrl : "",
            platforms: platformsFromHistory,
            useBrandVoice: Boolean(o.useBrandVoice),
            brandProfileId: typeof o.brandProfileId === "string" ? o.brandProfileId : null,
            publishMode: o.publishMode === "spoken" || o.publishMode === "review" ? o.publishMode : "image_text",
            conversionGoal:
              o.conversionGoal === "engagement" || o.conversionGoal === "leads" || o.conversionGoal === "sales"
                ? o.conversionGoal
                : "awareness",
            focusAngle: typeof o.focusAngle === "string" ? o.focusAngle : "",
            pack: o.pack as SellingPack,
          } as GenerateHistoryItem;
        })
        .filter((item): item is GenerateHistoryItem => item !== null);
      setHistoryItems(records);
    } catch {
      // ignore parse errors
    }
  }, []);

  function persistHistory(items: GenerateHistoryItem[]) {
    setHistoryItems(items);
    try {
      window.localStorage.setItem(GENERATE_HISTORY_KEY, JSON.stringify(items));
    } catch {}
  }

  async function handleGenerate() {
    const text = productText.trim();
    if (!text) {
      setError("请填写产品描述");
      return;
    }

    setError("");
    setStep("loading");
    trackEvent({ event: "flow_start_generate", payload: { flow: FLOW_NAME } });

    try {
      const analyzeRes = await fetch("/api/analyze-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          url: productUrl.trim() || undefined,
        }),
      });
      if (!analyzeRes.ok) {
        const data = await analyzeRes.json().catch(() => ({}));
        throw new Error(data?.error || "产品分析失败");
      }
      const product: AnalyzedProduct = await analyzeRes.json();

      let brandVoice = undefined;
      if (useBrandVoice && typeof window !== "undefined") {
        const { profiles, activeId } = loadStyleProfileListFromStorage(window.localStorage);
        const selected = selectedBrandProfileId
          ? profiles.find((p) => p.id === selectedBrandProfileId) ?? null
          : getActiveStyleProfile(profiles, activeId);
        brandVoice = selected?.profile;
      }

      const packRes = await fetch("/api/generate-selling-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product,
          platforms,
          brandVoice: brandVoice && (brandVoice.brandVoice || brandVoice.audience) ? brandVoice : undefined,
          publishMode,
          conversionGoal,
          focusAngle: focusAngle.trim() || undefined,
        }),
      });
      if (!packRes.ok) {
        const data = await packRes.json().catch(() => ({}));
        throw new Error(data?.error || "内容包生成失败");
      }
      const packData: SellingPack = await packRes.json();
      setPack(packData);
      setStep("result");
      const nextHistory: GenerateHistoryItem[] = [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
          productText: text,
          productUrl: productUrl.trim(),
          platforms,
          useBrandVoice: Boolean(useBrandVoice),
          brandProfileId: useBrandVoice ? selectedBrandProfileId : null,
          publishMode,
          conversionGoal,
          focusAngle,
          pack: packData,
        },
        ...historyItems,
      ].slice(0, MAX_HISTORY_ITEMS);
      persistHistory(nextHistory);
      trackEvent({ event: "flow_complete_generate", payload: { flow: FLOW_NAME } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败，请重试");
      setStep("input");
      trackEvent({ event: "flow_error_generate", payload: { flow: FLOW_NAME } });
    }
  }

  function downloadAll() {
    if (!pack) return;
    const lines: string[] = [
      `# ${pack.product.name} - 全平台带货内容包`,
      `生成时间：${pack.generatedAt}`,
      "",
    ];
    pack.platforms.forEach((p) => {
      lines.push(`## ${p.platformName}`);
      p.variants.forEach((v) => {
        lines.push(`### 变体 ${v.id}`);
        lines.push(v.title);
        lines.push(v.hook);
        lines.push(v.body);
        lines.push(v.cta);
        lines.push(v.tags.join(" "));
        lines.push("");
      });
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sellboost-${pack.product.name}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyHistoryInput(item: GenerateHistoryItem) {
    setProductText(item.productText);
    setProductUrl(item.productUrl);
    setPlatforms(item.platforms);
    setUseBrandVoice(item.useBrandVoice);
    setSelectedBrandProfileId(item.brandProfileId);
    setPublishMode(item.publishMode);
    setConversionGoal(item.conversionGoal);
    setFocusAngle(item.focusAngle);
    setError("");
    setStep("input");
  }

  function openHistoryResult(item: GenerateHistoryItem) {
    setPack(item.pack);
    setStep("result");
  }

  function deleteHistoryItem(id: string) {
    const next = historyItems.filter((item) => item.id !== id);
    persistHistory(next);
  }

  if (step === "loading") {
    return (
      <main className="relative z-10 mx-auto min-h-[80vh] flex items-center justify-center max-w-3xl px-4 py-12">
        <div className="absolute inset-0 -z-10 flex items-center justify-center pointer-events-none">
          <div className="h-[400px] w-[400px] rounded-full bg-orange-500/10 blur-[120px]" />
        </div>
        <div className="glass-card w-full p-12 text-center rounded-3xl border border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl">
          <LoadingSpinner stage="AI 正在深度拆解产品并构建内容策略矩阵..." />
          <p className="mt-6 text-sm text-gray-400">这可能需要 15-30 秒，请耐心等待</p>
        </div>
      </main>
    );
  }

  if (step === "result" && pack) {
    const basis = [
      `核心产品：${pack.product.name}`,
      ...pack.product.usps.slice(0, 3),
      ...pack.product.differentiators.slice(0, 2),
    ];
    const risks = [
      "AI 生成内容具备随机性，发布前务必人工核对业务信息",
      "不同平台限流规则可能随时更新，请注意避免最新违禁词",
    ];
    const checkpoints = [
      "检查核心卖点是否夸大或虚假承诺",
      "确认标题和文案长度符合各平台最佳实践",
      "核对转化引导（CTA）是否符合当前商业目标",
    ];

    return (
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 pb-24">
        {/* Result Header */}
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-400/80">
                生成成功
              </p>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-white/95">
              内容矩阵已就绪
            </h1>
            <p className="mt-2 text-base text-gray-400">
              基于您的策略，AI 为 {pack.platforms.length} 个平台定制了专属种草文案。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStep("input");
                setPack(null);
              }}
              className="group flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              <svg className="h-4 w-4 text-gray-400 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回修改
            </button>
            <button
              onClick={downloadAll}
              className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:brightness-110"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              一键下载全部
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <PlatformResultTabs platforms={pack.platforms} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <ProductAnalysisCard product={pack.product} />
            <VerifiedResultCard
              basis={basis}
              risks={risks}
              checkpoints={checkpoints}
              onRegenerate={() => {
                setStep("input");
                setPack(null);
              }}
              onBacktrack={() => {
                setStep("input");
                setPack(null);
              }}
            />
            <FlowFeedback flow={FLOW_NAME} />
          </div>
        </div>
      </main>
    );
  }

  // Input Step (Default)
  return (
    <main className="relative z-10 mx-auto max-w-7xl px-4 py-10 pb-24">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
      
      {/* Page Header */}
      <header className="mb-10 text-center md:text-left">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-orange-400/80">
          Content Engine v2
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white/95 md:text-4xl">
          生成带货内容矩阵
        </h1>
        <p className="mt-3 text-base text-gray-400 max-w-2xl">
          只需输入产品核心信息与营销策略，AI 引擎将自动匹配各社交平台算法规则，一次性产出高质量、高转化的图文或口播内容。
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-8">
          <section className="rounded-3xl border border-white/10 bg-[#09090b]/80 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="font-heading text-lg font-semibold tracking-wide text-white/90">
                构建内容策略
              </h2>
            </div>

            <div className="space-y-8">
              {/* Product Info */}
              <div className="space-y-5">
                <div>
                  <label className="mb-2.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                    产品/服务核心描述 <span className="text-orange-400">*</span>
                  </label>
                  <textarea
                    value={productText}
                    onChange={(e) => setProductText(e.target.value)}
                    placeholder="例如：一款专门针对油敏肌的积雪草舒缓精华，核心成分是 5% 高浓度积雪草提取物，无酒精无香精。适合熬夜爆痘急救，价格 129元/30ml..."
                    rows={5}
                    className="w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-sm text-white/90 placeholder-gray-500 transition-all focus:border-orange-500/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
                <div>
                  <label className="mb-2.5 flex items-center gap-2 text-sm font-medium text-gray-300">
                    参考链接 <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">可选</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <input
                      type="url"
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="输入商品详情页、官网或竞品链接（AI 将自动抓取信息）"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 py-3.5 pl-11 pr-4 text-sm text-white/90 placeholder-gray-500 transition-all focus:border-orange-500/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Platform Selector */}
              <div className="pt-4 border-t border-white/5">
                <label className="mb-4 block text-sm font-medium text-gray-300">
                  分发平台
                </label>
                <PlatformSelector selected={platforms} onChange={setPlatforms} />
              </div>

              {/* Advanced Settings */}
              <div className="pt-4 border-t border-white/5 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-gray-300">
                    内容表现形式
                  </label>
                  <div className="relative">
                    <select
                      value={publishMode}
                      onChange={(e) =>
                        setPublishMode(e.target.value as "image_text" | "spoken" | "review")
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 pr-10 text-sm text-white/90 transition-all focus:border-orange-500/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    >
                      <option value="image_text" className="bg-[#1a1a1a] text-gray-200">图文种草 (适合小红书/公众号)</option>
                      <option value="spoken" className="bg-[#1a1a1a] text-gray-200">口播短视频 (适合抖音/快手/视频号)</option>
                      <option value="review" className="bg-[#1a1a1a] text-gray-200">深度横评/对比 (适合B站/小红书长文)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-gray-300">
                    首要转化目标
                  </label>
                  <div className="relative">
                    <select
                      value={conversionGoal}
                      onChange={(e) =>
                        setConversionGoal(e.target.value as "awareness" | "engagement" | "leads" | "sales")
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 pr-10 text-sm text-white/90 transition-all focus:border-orange-500/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                    >
                      <option value="awareness" className="bg-[#1a1a1a] text-gray-200">曝光与心智教育 (弱营销)</option>
                      <option value="engagement" className="bg-[#1a1a1a] text-gray-200">引发互动/评论 (吸粉涨粉)</option>
                      <option value="leads" className="bg-[#1a1a1a] text-gray-200">引流私域/留资 (引导加微)</option>
                      <option value="sales" className="bg-[#1a1a1a] text-gray-200">直接带货/挂车 (强转化成交)</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-gray-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2.5 block text-sm font-medium text-gray-300">
                    特定内容切入点 <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">可选</span>
                  </label>
                  <input
                    type="text"
                    value={focusAngle}
                    onChange={(e) => setFocusAngle(e.target.value)}
                    placeholder="例如：强调性价比极高、重点针对熬夜加班人群、制造紧迫感促销..."
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white/90 placeholder-gray-500 transition-all focus:border-orange-500/50 focus:bg-black/60 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              {/* Brand Voice */}
              {hasBrandVoice && (
                <div className="pt-4 border-t border-white/5">
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.02] p-5 transition-all">
                    <label className="flex cursor-pointer items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${useBrandVoice ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/5 text-gray-400'} transition-all`}>
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${useBrandVoice ? 'text-white' : 'text-gray-300'}`}>启用品牌定制语感</p>
                          <p className="mt-0.5 text-xs text-gray-500">让生成的内容更符合您的品牌专属调性与禁忌</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={useBrandVoice}
                          onChange={(e) => setUseBrandVoice(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`block h-6 w-10 rounded-full transition-colors ${useBrandVoice ? 'bg-orange-500' : 'bg-gray-700'}`}></div>
                        <div className={`dot absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${useBrandVoice ? 'translate-x-4' : ''}`}></div>
                      </div>
                    </label>
                    
                    {useBrandVoice && brandProfiles.length > 0 && (
                      <div className="mt-5 animate-in slide-in-from-top-2 fade-in duration-200">
                        <label className="mb-2 block text-xs font-medium text-orange-400/80 uppercase tracking-wider">选择应用档案</label>
                        <div className="relative">
                          <select
                            value={selectedBrandProfileId ?? ""}
                            onChange={(e) => setSelectedBrandProfileId(e.target.value || null)}
                            className="w-full appearance-none rounded-xl border border-orange-500/20 bg-black/60 px-4 py-3 pr-10 text-sm text-white/90 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            {brandProfiles.map((p) => (
                              <option key={p.id} value={p.id} className="bg-[#1a1a1a] text-gray-200">
                                {p.profileName}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-orange-500/60">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!productText.trim()}
                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(249,115,22,0.2)] transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:brightness-110 disabled:opacity-50 disabled:hover:shadow-[0_0_30px_rgba(249,115,22,0.2)] disabled:hover:brightness-100"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                智能分析并生成策略矩阵
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-4 space-y-6">
          {historyItems.length > 0 ? (
            <section className="rounded-3xl border border-white/5 bg-[#09090b]/60 p-6 backdrop-blur-md">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-heading text-sm font-semibold text-white/80">生成历史</h3>
                </div>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {historyItems.length} 条记录
                </span>
              </div>
              <div className="space-y-3">
                {historyItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-gray-200">
                        {item.pack.product.name || item.productText.slice(0, 30) || "未命名记录"}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteHistoryItem(item.id)}
                        className="opacity-0 transition-opacity group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
                        title="删除记录"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {item.platforms.slice(0, 3).map(p => (
                        <span key={p} className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-gray-400 uppercase">
                          {p.substring(0,2)}
                        </span>
                      ))}
                      {item.platforms.length > 3 && (
                        <span className="rounded border border-white/10 bg-black/40 px-1.5 py-0.5 text-[10px] text-gray-400">+{item.platforms.length - 3}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => applyHistoryInput(item)}
                        className="flex-1 rounded-lg bg-white/5 py-2 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        复用参数
                      </button>
                      <button
                        type="button"
                        onClick={() => openHistoryResult(item)}
                        className="flex-1 rounded-lg bg-orange-500/10 border border-orange-500/20 py-2 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20 hover:text-orange-300"
                      >
                        查看结果
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="rounded-3xl border border-white/5 border-dashed bg-white/[0.01] p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">暂无生成记录</p>
              <p className="mt-1 text-xs text-gray-500">您成功生成的内容矩阵将自动保存在这里</p>
            </div>
          )}
          
          <div className="rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent p-5 border border-blue-500/20">
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              高转化 Tip
            </h4>
            <p className="text-xs text-blue-300/80 leading-relaxed">
              输入内容越详细，包含产品痛点、独特优势或受众特征，AI 生成的文案和脚本质量就越高。您可以直接把京东淘宝的详情页文案复制进去。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
