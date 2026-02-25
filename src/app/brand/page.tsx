"use client";

import { useState, useEffect } from "react";
import {
  DEFAULT_STYLE_PROFILE,
  createStyleProfileRecord,
  getActiveStyleProfile,
  loadStyleProfileListFromStorage,
  persistStyleProfiles,
} from "@/lib/style-profile";
import type { StyleProfile, StyleProfileRecord } from "@/lib/style-profile";

export default function BrandPage() {
  const [form, setForm] = useState<StyleProfile>(DEFAULT_STYLE_PROFILE);
  const [profiles, setProfiles] = useState<StyleProfileRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("默认品牌语音");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const { profiles: list, activeId: currentActiveId } =
        loadStyleProfileListFromStorage(window.localStorage);
      setProfiles(list);
      setActiveId(currentActiveId);

      const active = getActiveStyleProfile(list, currentActiveId);
      if (active) {
        setForm(active.profile);
        setProfileName(active.profileName);
      }
    } catch {
      // keep default
    }
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const nextProfiles = [...profiles];
      if (activeId) {
        const idx = nextProfiles.findIndex((p) => p.id === activeId);
        if (idx >= 0) {
          nextProfiles[idx] = {
            ...nextProfiles[idx],
            profileName: profileName.trim() || "未命名档案",
            profile: form,
            updatedAt: new Date().toISOString(),
          };
        } else {
          const created = createStyleProfileRecord(profileName, form);
          nextProfiles.unshift(created);
          setActiveId(created.id);
        }
      } else {
        const created = createStyleProfileRecord(profileName, form);
        nextProfiles.unshift(created);
        setActiveId(created.id);
      }

      setProfiles(nextProfiles);
      persistStyleProfiles(window.localStorage, nextProfiles, activeId ?? nextProfiles[0]?.id ?? null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
  }

  function handleCreateNew() {
    setActiveId(null);
    setProfileName(`品牌语音 ${profiles.length + 1}`);
    setForm(DEFAULT_STYLE_PROFILE);
    setSaved(false);
  }

  function handleSelectProfile(id: string) {
    const p = profiles.find((item) => item.id === id);
    if (!p) return;
    setActiveId(id);
    setProfileName(p.profileName);
    setForm(p.profile);
    setSaved(false);
  }

  function handleDeleteProfile(id: string) {
    const next = profiles.filter((p) => p.id !== id);
    const nextActive = next.length > 0 ? next[0].id : null;
    setProfiles(next);
    setActiveId(nextActive);
    if (next.length > 0) {
      setProfileName(next[0].profileName);
      setForm(next[0].profile);
    } else {
      setProfileName("默认品牌语音");
      setForm(DEFAULT_STYLE_PROFILE);
    }
    persistStyleProfiles(window.localStorage, next, nextActive);
  }

  const fields: { key: keyof StyleProfile; label: string; placeholder: string; type?: "text" | "number" }[] = [
    { key: "brandName", label: "品牌名称", placeholder: "如：XX 旗舰店" },
    { key: "industry", label: "所属行业", placeholder: "如：美妆、食品、数码" },
    { key: "productCategory", label: "产品品类", placeholder: "如：护肤、零食、耳机" },
    { key: "brandVoice", label: "品牌调性", placeholder: "如：专业可信、亲切有趣" },
    { key: "audience", label: "目标受众", placeholder: "如：25-35 岁职场女性" },
    { key: "preferredWords", label: "偏好用词", placeholder: "希望文案中多出现的词，逗号分隔" },
    { key: "forbiddenWords", label: "禁用词汇", placeholder: "绝不出现的词，逗号分隔" },
    { key: "ctaPreference", label: "CTA 偏好", placeholder: "如：温和引导、直接促销" },
    { key: "competitorKeywords", label: "竞品关键词", placeholder: "可选，用于差异化" },
    { key: "successCases", label: "成功案例参考", placeholder: "可粘贴一条你满意的历史文案" },
  ];

  return (
    <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 pb-16">
      <div className="mb-6">
        <p className="mb-1 text-xs uppercase tracking-[0.14em] text-gray-500">
          Brand Voice Studio
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-white">
          品牌语音
        </h1>
        <p className="mt-1 text-sm text-gray-400">
        可保存多套品牌语音（不同产品/品牌/投放场景），生成页可按需选择具体档案。
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="glass-card p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-300">
                档案名称
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="input-glass w-full"
                placeholder="如：护肤品牌-小红书风格"
              />
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="btn-ghost"
            >
              新建档案
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {profiles.length === 0 ? (
              <span className="text-xs text-gray-500">暂无已保存档案</span>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${
                    activeId === p.id
                      ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                      : "border-surface-border bg-surface text-gray-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectProfile(p.id)}
                    className="max-w-[180px] truncate"
                    title={p.profileName}
                  >
                    {p.profileName}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProfile(p.id)}
                    className="text-gray-500 hover:text-red-300"
                    aria-label={`删除 ${p.profileName}`}
                    title="删除档案"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-4 md:p-5">
          <h2 className="mb-4 font-heading text-sm font-semibold tracking-wide text-white">
            档案详细设置
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(({ key, label, placeholder }) => (
              <div key={key} className={key === "successCases" ? "md:col-span-2" : ""}>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">
                  {label}
                </label>
                {key === "successCases" ? (
                  <textarea
                    value={form[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    rows={4}
                    className="input-glass w-full resize-y"
                  />
                ) : (
                  <input
                    type="text"
                    value={form[key] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input-glass w-full"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              语气级别：{form.toneLevel <= 25 ? "非常口语" : form.toneLevel <= 50 ? "自然轻松" : form.toneLevel <= 75 ? "专业易懂" : "正式专业"}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={form.toneLevel}
              onChange={(e) => setForm((f) => ({ ...f, toneLevel: Number(e.target.value) }))}
              className="h-2 w-full appearance-none rounded-full bg-surface accent-orange-500"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>口语化</span>
              <span>专业化</span>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">
          {saved ? "已保存" : "保存当前档案"}
        </button>
      </form>
    </main>
  );
}
