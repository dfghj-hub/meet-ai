export interface StyleProfile {
  brandName: string;
  brandVoice: string;
  audience: string;
  preferredWords: string;
  forbiddenWords: string;
  ctaPreference: string;
  industry: string;
  productCategory: string;
  competitorKeywords: string;
  successCases: string;
  toneLevel: number;
}

export interface StyleProfileRecord {
  id: string;
  profileName: string;
  profile: StyleProfile;
  updatedAt: string;
}

export const DEFAULT_STYLE_PROFILE: StyleProfile = {
  brandName: "",
  brandVoice: "",
  audience: "",
  preferredWords: "",
  forbiddenWords: "",
  ctaPreference: "",
  industry: "",
  productCategory: "",
  competitorKeywords: "",
  successCases: "",
  toneLevel: 50,
};

export const STYLE_PROFILE_KEY = "sellboost_brand_voice_v1";
export const STYLE_PROFILE_LIST_KEY = "sellboost_brand_voice_profiles_v1";
export const STYLE_PROFILE_ACTIVE_ID_KEY = "sellboost_brand_voice_active_id_v1";

function createProfileId(): string {
  return `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function parseStyleProfile(raw: unknown): StyleProfile {
  if (!raw || typeof raw !== "object") return DEFAULT_STYLE_PROFILE;
  const obj = raw as Record<string, unknown>;
  return {
    brandName: typeof obj.brandName === "string" ? obj.brandName : "",
    brandVoice: typeof obj.brandVoice === "string" ? obj.brandVoice : "",
    audience: typeof obj.audience === "string" ? obj.audience : "",
    preferredWords: typeof obj.preferredWords === "string" ? obj.preferredWords : "",
    forbiddenWords: typeof obj.forbiddenWords === "string" ? obj.forbiddenWords : "",
    ctaPreference: typeof obj.ctaPreference === "string" ? obj.ctaPreference : "",
    industry: typeof obj.industry === "string" ? obj.industry : "",
    productCategory: typeof obj.productCategory === "string" ? obj.productCategory : "",
    competitorKeywords: typeof obj.competitorKeywords === "string" ? obj.competitorKeywords : "",
    successCases: typeof obj.successCases === "string" ? obj.successCases : "",
    toneLevel: typeof obj.toneLevel === "number" ? obj.toneLevel : 50,
  };
}

export function hasStyleProfile(profile?: Partial<StyleProfile> | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.brandName ||
      profile.brandVoice ||
      profile.audience ||
      profile.preferredWords ||
      profile.forbiddenWords ||
      profile.ctaPreference ||
      profile.industry
  );
}

export function createStyleProfileRecord(
  profileName: string,
  profile?: Partial<StyleProfile>
): StyleProfileRecord {
  return {
    id: createProfileId(),
    profileName: profileName.trim() || "未命名档案",
    profile: parseStyleProfile(profile ?? {}),
    updatedAt: new Date().toISOString(),
  };
}

function parseStyleProfileRecord(raw: unknown): StyleProfileRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" ? obj.id : createProfileId();
  const profileName = typeof obj.profileName === "string" ? obj.profileName : "未命名档案";
  const updatedAt =
    typeof obj.updatedAt === "string" ? obj.updatedAt : new Date().toISOString();
  const profile = parseStyleProfile(obj.profile);
  return { id, profileName, profile, updatedAt };
}

export function parseStyleProfileList(raw: unknown): StyleProfileRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseStyleProfileRecord)
    .filter((item): item is StyleProfileRecord => item !== null);
}

export function loadStyleProfileListFromStorage(storage: Storage): {
  profiles: StyleProfileRecord[];
  activeId: string | null;
} {
  try {
    const rawList = storage.getItem(STYLE_PROFILE_LIST_KEY);
    const activeId = storage.getItem(STYLE_PROFILE_ACTIVE_ID_KEY);
    const profiles = rawList ? parseStyleProfileList(JSON.parse(rawList)) : [];
    if (profiles.length > 0) {
      const normalizedActiveId =
        activeId && profiles.some((p) => p.id === activeId) ? activeId : profiles[0].id;
      return { profiles, activeId: normalizedActiveId };
    }

    // Backward compatibility: migrate old single profile data.
    const legacyRaw = storage.getItem(STYLE_PROFILE_KEY);
    if (legacyRaw) {
      const migrated = createStyleProfileRecord(
        "默认品牌语音",
        parseStyleProfile(JSON.parse(legacyRaw))
      );
      return { profiles: [migrated], activeId: migrated.id };
    }
  } catch {
    // ignore parse/storage errors
  }
  return { profiles: [], activeId: null };
}

export function persistStyleProfiles(
  storage: Storage,
  profiles: StyleProfileRecord[],
  activeId: string | null
): void {
  storage.setItem(STYLE_PROFILE_LIST_KEY, JSON.stringify(profiles));
  if (activeId) {
    storage.setItem(STYLE_PROFILE_ACTIVE_ID_KEY, activeId);
  } else {
    storage.removeItem(STYLE_PROFILE_ACTIVE_ID_KEY);
  }

  // Keep legacy key updated for backward compatibility with older code paths.
  const active = activeId ? profiles.find((p) => p.id === activeId) : profiles[0];
  if (active) {
    storage.setItem(STYLE_PROFILE_KEY, JSON.stringify(active.profile));
  } else {
    storage.removeItem(STYLE_PROFILE_KEY);
  }
}

export function getActiveStyleProfile(
  profiles: StyleProfileRecord[],
  activeId: string | null
): StyleProfileRecord | null {
  if (profiles.length === 0) return null;
  if (!activeId) return profiles[0];
  return profiles.find((p) => p.id === activeId) ?? profiles[0];
}

export function styleProfileToPromptBlock(profile: StyleProfile): string {
  const lines: string[] = [];
  if (profile.brandName) lines.push(`品牌名称：${profile.brandName}`);
  if (profile.industry) lines.push(`所属行业：${profile.industry}`);
  if (profile.productCategory) lines.push(`产品品类：${profile.productCategory}`);
  if (profile.brandVoice) lines.push(`品牌调性：${profile.brandVoice}`);
  if (profile.audience) lines.push(`目标受众：${profile.audience}`);
  if (profile.preferredWords) lines.push(`偏好用词：${profile.preferredWords}`);
  if (profile.forbiddenWords) lines.push(`禁用词汇：${profile.forbiddenWords}`);
  if (profile.ctaPreference) lines.push(`CTA 偏好：${profile.ctaPreference}`);
  if (profile.competitorKeywords) lines.push(`竞品关键词：${profile.competitorKeywords}`);
  if (profile.successCases) lines.push(`成功案例参考：${profile.successCases}`);

  const toneDesc =
    profile.toneLevel <= 25
      ? "非常口语化、亲切随意"
      : profile.toneLevel <= 50
        ? "自然轻松、有亲和力"
        : profile.toneLevel <= 75
          ? "专业但易懂"
          : "正式专业、权威感强";
  lines.push(`语气级别：${toneDesc}（${profile.toneLevel}/100）`);

  return lines.length > 0 ? `【品牌语音设置】\n${lines.join("\n")}` : "";
}
