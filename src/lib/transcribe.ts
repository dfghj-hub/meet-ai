import OpenAI from "openai";
import { loadEnv } from "@/config/llm";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25MB

/** 语音转写使用 OpenAI Whisper API，与摘要所用大模型（DeepSeek 等）无关 */

export interface TranscribeResult {
  text: string;
  durationMinutes?: number;
}

/** 从音频 URL 拉取并转写（Whisper）。 */
export async function transcribeAudio(
  audioUrl: string
): Promise<TranscribeResult> {
  loadEnv();
  const apiKey = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!apiKey) {
    throw new Error("上传录音需要配置 OPENAI_API_KEY（语音转写使用 Whisper）。请在 .env 中填写。");
  }
  const whisper = new OpenAI({ apiKey });

  const res = await fetch(audioUrl);
  if (!res.ok) {
    throw new Error(`拉取音频失败: ${res.status}`);
  }

  const contentLength = res.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_AUDIO_BYTES) {
    throw new Error("音频文件超过 25MB 限制");
  }

  const blob = await res.blob();
  if (blob.size > MAX_AUDIO_BYTES) {
    throw new Error("音频文件超过 25MB 限制");
  }

  const file = new File([blob], "audio.mp3", { type: blob.type || "audio/mpeg" });

  const transcription = await whisper.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "zh",
  });

  return {
    text: transcription.text,
  };
}
