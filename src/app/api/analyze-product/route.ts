import { NextRequest, NextResponse } from "next/server";
import { loadEnv } from "@/config/llm";
import { llmGenerate } from "@/lib/llm/generate";
import type { AnalyzedProduct, AudienceSegment } from "@/lib/types";
import { safeErrorMessage } from "@/lib/safe-error";

loadEnv();

const SYSTEM_PROMPT = `你是一位资深电商与营销分析师。根据用户提供的产品/服务描述，做一次结构化分析，用于后续生成多平台带货文案。

分析维度：
1. name：产品/服务名称（简短准确）
2. category：所属品类（如美妆、食品、数码、课程等）
3. usps：核心卖点列表，3-6 条，每条一句话
4. audienceSegments：目标受众画像，2-4 个细分人群，每项包含 label（人群标签）、description（简要描述）、painPoints（痛点列表，2-4 条）
5. pricePositioning：价格定位描述（如平价、轻奢、高端、性价比等）
6. emotionalTriggers：可打的情感触发点，3-5 个（如省心、变美、身份认同、安全感等）
7. differentiators：与竞品的差异化优势，2-4 条
8. summary：一段话总结（50-80 字），便于后续写文案时快速抓重点

只输出合法 JSON，不要 markdown 包裹。格式如下：
{
  "name": "产品名",
  "category": "品类",
  "usps": ["卖点1", "卖点2"],
  "audienceSegments": [
    { "label": "人群标签", "description": "描述", "painPoints": ["痛点1", "痛点2"] }
  ],
  "pricePositioning": "价格定位",
  "emotionalTriggers": ["情感1", "情感2"],
  "differentiators": ["差异1", "差异2"],
  "summary": "一段话总结"
}`;

const MAX_TEXT_LENGTH = 8000;

function parseAudienceSegment(raw: unknown): AudienceSegment {
  if (!raw || typeof raw !== "object") {
    return { label: "", description: "", painPoints: [] };
  }
  const o = raw as Record<string, unknown>;
  const painPoints = Array.isArray(o.painPoints)
    ? (o.painPoints as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  return {
    label: typeof o.label === "string" ? o.label : "",
    description: typeof o.description === "string" ? o.description : "",
    painPoints,
  };
}

function parseAnalyzedProduct(raw: unknown): AnalyzedProduct {
  if (!raw || typeof raw !== "object") {
    throw new Error("格式错误");
  }
  const o = raw as Record<string, unknown>;
  const audienceSegments = Array.isArray(o.audienceSegments)
    ? (o.audienceSegments as unknown[]).map(parseAudienceSegment)
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
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const url = typeof body?.url === "string" ? body.url.trim() : undefined;

    if (!text) {
      return NextResponse.json({ error: "请提供产品/服务描述文本" }, { status: 400 });
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `描述文本过长，最多 ${MAX_TEXT_LENGTH} 字` },
        { status: 400 }
      );
    }

    const userMsg = url
      ? `产品/服务描述：\n${text}\n\n参考链接（如有用可纳入分析）：${url}`
      : `产品/服务描述：\n${text}`;

    const raw = await llmGenerate(SYSTEM_PROMPT, userMsg, {
      json: true,
      temperature: 0.3,
    });

    const jsonStr = raw.trim().replace(/^```json?\s*|\s*```$/g, "");
    const parsed = JSON.parse(jsonStr) as unknown;
    const result = parseAnalyzedProduct(parsed);

    return NextResponse.json(result);
  } catch (err) {
    const message = safeErrorMessage(err, "产品分析失败，请稍后重试");
    const status = message.includes("请提供") || message.includes("过长") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
