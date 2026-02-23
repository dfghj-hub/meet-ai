import { NextResponse } from "next/server";
import { summarizeMeetingTranscript } from "@/lib/llm/summarize";
import { MAX_TEXT_LENGTH } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "请提供 text 字段（会议记录或转写稿）" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `文本长度超过限制（${MAX_TEXT_LENGTH} 字符）` },
        { status: 400 }
      );
    }

    const result = await summarizeMeetingTranscript(text);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "生成纪要失败";
    const status = message.includes("格式") ? 502 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
