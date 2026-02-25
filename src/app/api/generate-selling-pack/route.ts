import { NextRequest, NextResponse } from "next/server";
import { loadEnv } from "@/config/llm";
import { llmGenerate } from "@/lib/llm/generate";
import {
  ALL_PLATFORM_IDS,
  getPlatformRule,
  getPlatformRulesForPrompt,
} from "@/lib/platforms";
import type { PlatformId } from "@/lib/platforms";
import {
  parseStyleProfile,
  hasStyleProfile,
  styleProfileToPromptBlock,
} from "@/lib/style-profile";
import type {
  AnalyzedProduct,
  CopyVariant,
  PlatformContent,
  SellingPack,
} from "@/lib/types";
import { safeErrorMessage } from "@/lib/safe-error";

loadEnv();

const PLATFORM_CONTENT_SYSTEM_TEMPLATE = `你是资深社交电商文案专家。根据已分析的产品信息和下方「平台规则」，为该平台生成 3 条带货文案变体（A、B、C），用于 A/B 测试。

【平台规则】
%PLATFORM_RULES%

要求：
1. 每条变体必须包含：title（标题，严格符合字数上限）、body（正文）、tags（话题标签数组）、hook（开头钩子句）、cta（结尾行动号召）、engagementScore（预估互动分数 1-100）、postingTime（建议发布时间，如 "晚 19:00"）
2. 标题和正文不得超过平台字数限制，标签数量不得超过平台要求
3. 三条变体风格要有差异：可一偏理性、一偏情感、一偏紧迫/稀缺
4. 所有内容必须基于提供的产品信息，不得虚构产品没有的卖点

只输出合法 JSON，不要 markdown 包裹。格式：
{
  "variants": [
    {
      "id": "A",
      "title": "标题",
      "body": "正文",
      "tags": ["#标签1", "#标签2"],
      "hook": "开头钩子",
      "cta": "结尾 CTA",
      "engagementScore": 75,
      "postingTime": "晚 19:00"
    },
    { "id": "B", ... },
    { "id": "C", ... }
  ]
}`;

function buildProductBlock(product: AnalyzedProduct): string {
  return [
    "【产品分析摘要】",
    `名称：${product.name}`,
    `品类：${product.category}`,
    `总结：${product.summary}`,
    `核心卖点：${product.usps.join("；")}`,
    `价格定位：${product.pricePositioning}`,
    `情感触发：${product.emotionalTriggers.join("、")}`,
    `差异化：${product.differentiators.join("；")}`,
    `目标受众痛点：${product.audienceSegments.map((a) => a.label + "：" + a.painPoints.join("，")).join("；")}`,
  ].join("\n");
}

function parseVariant(raw: unknown): CopyVariant | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id === "A" || o.id === "B" || o.id === "C" ? o.id : "A";
  const tags = Array.isArray(o.tags)
    ? (o.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  const engagementScore =
    typeof o.engagementScore === "number"
      ? Math.min(100, Math.max(1, Math.round(o.engagementScore)))
      : 70;
  return {
    id,
    title: typeof o.title === "string" ? o.title : "",
    body: typeof o.body === "string" ? o.body : "",
    tags,
    hook: typeof o.hook === "string" ? o.hook : "",
    cta: typeof o.cta === "string" ? o.cta : "",
    engagementScore,
    postingTime: typeof o.postingTime === "string" ? o.postingTime : "",
  };
}

type PublishMode = "image_text" | "spoken" | "review";
type ConversionGoal = "awareness" | "engagement" | "leads" | "sales";

function getPublishModeGuidance(mode: PublishMode): string {
  switch (mode) {
    case "spoken":
      return "发布模板：口播短视频。正文优先输出可直接口播的短句结构，节奏紧凑，开头 3 秒钩子更强，包含镜头口播提示。";
    case "review":
      return "发布模板：测评/对比。正文要包含对比维度、优缺点、适用人群与购买建议，语气更客观。";
    case "image_text":
    default:
      return "发布模板：图文种草。正文分段清晰，便于配图发布，强调卖点拆解和收藏价值。";
  }
}

function getConversionGoalGuidance(goal: ConversionGoal): string {
  switch (goal) {
    case "engagement":
      return "转化目标：提升互动。优先引导评论/点赞/收藏，问题式结尾更强。";
    case "leads":
      return "转化目标：私域留资。强调私信/评论关键词/咨询动作。";
    case "sales":
      return "转化目标：直接成交。强调购买理由、限时利益点和明确行动路径。";
    case "awareness":
    default:
      return "转化目标：品牌种草。优先建立认知与好感，减少硬广压迫感。";
  }
}

async function generateForPlatform(
  product: AnalyzedProduct,
  platformId: PlatformId,
  brandVoiceBlock: string,
  publishMode: PublishMode,
  conversionGoal: ConversionGoal,
  focusAngle: string
): Promise<PlatformContent> {
  const rule = getPlatformRule(platformId);
  const platformRules = getPlatformRulesForPrompt(platformId);
  const systemPrompt = PLATFORM_CONTENT_SYSTEM_TEMPLATE.replace(
    "%PLATFORM_RULES%",
    platformRules
  );
  const userMsg = [
    buildProductBlock(product),
    getPublishModeGuidance(publishMode),
    getConversionGoalGuidance(conversionGoal),
    focusAngle ? `内容角度偏好：${focusAngle}` : "",
    brandVoiceBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  const raw = await llmGenerate(systemPrompt, userMsg, {
    json: true,
    temperature: 0.8,
  });

  const jsonStr = raw.trim().replace(/^```json?\s*|\s*```$/g, "");
  const parsed = JSON.parse(jsonStr) as { variants?: unknown[] };
  const variantsRaw = Array.isArray(parsed.variants) ? parsed.variants : [];
  const variants = variantsRaw.map(parseVariant).filter((v): v is CopyVariant => v !== null);
  if (variants.length === 0) {
    variants.push({
      id: "A",
      title: "",
      body: "",
      tags: [],
      hook: "",
      cta: "",
      engagementScore: 70,
      postingTime: rule.bestPractices[rule.bestPractices.length - 1]?.includes("发布") ? "晚 19-21 点" : "",
    });
  }

  return {
    platformId,
    platformName: rule.name,
    variants,
  };
}

function parseProduct(raw: unknown): AnalyzedProduct {
  if (!raw || typeof raw !== "object") throw new Error("产品数据无效");
  const o = raw as Record<string, unknown>;
  const audienceSegments = Array.isArray(o.audienceSegments)
    ? (o.audienceSegments as unknown[]).map((a) => {
        if (!a || typeof a !== "object") return { label: "", description: "", painPoints: [] as string[] };
        const x = a as Record<string, unknown>;
        const painPoints = Array.isArray(x.painPoints)
          ? (x.painPoints as unknown[]).filter((p): p is string => typeof p === "string")
          : [];
        return {
          label: typeof x.label === "string" ? x.label : "",
          description: typeof x.description === "string" ? x.description : "",
          painPoints,
        };
      })
    : [];
  const usps = Array.isArray(o.usps)
    ? (o.usps as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const emotionalTriggers = Array.isArray(o.emotionalTriggers)
    ? (o.emotionalTriggers as unknown[]).filter((e): e is string => typeof e === "string")
    : [];
  const differentiators = Array.isArray(o.differentiators)
    ? (o.differentiators as unknown[]).filter((d): d is string => typeof d === "string")
    : [];

  return {
    name: typeof o.name === "string" ? o.name : "未命名产品",
    category: typeof o.category === "string" ? o.category : "",
    usps,
    audienceSegments,
    pricePositioning: typeof o.pricePositioning === "string" ? o.pricePositioning : "",
    emotionalTriggers,
    differentiators,
    summary: typeof o.summary === "string" ? o.summary : "",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const productRaw = body?.product;
    const platformsRaw = body?.platforms;
    const brandVoiceRaw = body?.brandVoice;
    const publishModeRaw = body?.publishMode;
    const conversionGoalRaw = body?.conversionGoal;
    const focusAngleRaw = body?.focusAngle;

    if (!productRaw) {
      return NextResponse.json({ error: "请提供产品分析结果 product" }, { status: 400 });
    }

    const product = parseProduct(productRaw);
    const platformIds: PlatformId[] = Array.isArray(platformsRaw)
      ? (platformsRaw as unknown[])
          .filter((p): p is PlatformId =>
            typeof p === "string" && (ALL_PLATFORM_IDS as readonly string[]).includes(p)
          )
      : [];
    const selectedIds: PlatformId[] =
      platformIds.length > 0 ? platformIds : ["xiaohongshu", "douyin"];

    const publishMode: PublishMode =
      publishModeRaw === "spoken" || publishModeRaw === "review"
        ? publishModeRaw
        : "image_text";
    const conversionGoal: ConversionGoal =
      conversionGoalRaw === "engagement" ||
      conversionGoalRaw === "leads" ||
      conversionGoalRaw === "sales"
        ? conversionGoalRaw
        : "awareness";
    const focusAngle =
      typeof focusAngleRaw === "string" ? focusAngleRaw.trim().slice(0, 500) : "";

    const profile = parseStyleProfile(brandVoiceRaw);
    const brandVoiceBlock = hasStyleProfile(profile)
      ? styleProfileToPromptBlock(profile)
      : "";

    const platforms: PlatformContent[] = [];
    for (const platformId of selectedIds) {
      const content = await generateForPlatform(
        product,
        platformId,
        brandVoiceBlock,
        publishMode,
        conversionGoal,
        focusAngle
      );
      platforms.push(content);
    }

    const pack: SellingPack = {
      product,
      platforms,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(pack);
  } catch (err) {
    const message = safeErrorMessage(err, "带货内容包生成失败，请稍后重试");
    const status = message.includes("请提供") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
