import path from "path";
import { config } from "dotenv";

/** 强制从磁盘重新读取 .env，覆盖已有值（解决启动后修改 .env 不生效的问题） */
export function loadEnv(): void {
  config({ path: path.resolve(process.cwd(), ".env"), override: true });
}

/**
 * 大模型接入配置（摘要用）
 * 支持：DeepSeek（推荐）、OpenAI、Groq、Ollama；均为 OpenAI 兼容接口
 */
export type LLMProvider = "deepseek" | "openai" | "groq" | "ollama";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  /** 是否支持 response_format: { type: "json_object" }，否则用 prompt 约束 + 解析 */
  supportsJsonMode: boolean;
}

export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER ?? "deepseek").toLowerCase() as LLMProvider;
  const model = process.env.LLM_MODEL ?? "";

  switch (provider) {
    case "ollama":
      return {
        baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
        apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
        model: model || "qwen2.5:7b",
        supportsJsonMode: false,
      };
    case "deepseek":
      return {
        baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
        apiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
        model: model || "deepseek-chat",
        supportsJsonMode: true,
      };
    case "groq":
      return {
        baseURL: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
        apiKey: (process.env.GROQ_API_KEY ?? "").trim(),
        model: model || "llama-3.1-8b-instant",
        supportsJsonMode: true,
      };
    case "openai":
      return {
        baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        apiKey: (process.env.OPENAI_API_KEY ?? "").trim(),
        model: model || "gpt-4o-mini",
        supportsJsonMode: true,
      };
    default:
      return {
        baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
        apiKey: (process.env.DEEPSEEK_API_KEY ?? "").trim(),
        model: model || "deepseek-chat",
        supportsJsonMode: true,
      };
  }
}
