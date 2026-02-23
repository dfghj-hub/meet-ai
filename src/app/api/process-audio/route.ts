import { NextResponse } from "next/server";
import { summarizeMeetingTranscript } from "@/lib/llm/summarize";
import { transcribeAudio } from "@/lib/transcribe";

/** 同步：音频 URL → 转写 → 摘要，一次返回。适合短会议（建议 15 分钟内）。 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const audioUrl = typeof body?.audioUrl === "string" ? body.audioUrl.trim() : "";

    if (!audioUrl) {
      return NextResponse.json(
        { error: "请提供 audioUrl（上传后返回的链接）" },
        { status: 400 }
      );
    }

    const { text } = await transcribeAudio(audioUrl);
    if (!text?.trim()) {
      return NextResponse.json(
        { error: "转写结果为空，请检查音频是否清晰" },
        { status: 400 }
      );
    }

    const result = await summarizeMeetingTranscript(text);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "处理失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
