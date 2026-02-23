import OpenAI from "openai";
import { getLLMConfig, loadEnv } from "@/config/llm";

let cachedClient: OpenAI | null = null;

/** 清空客户端缓存（.env 更新后需重新取配置时调用） */
export function clearLLMClientCache(): void {
  cachedClient = null;
}

/** 获取大模型客户端（OpenAI 兼容接口，按 .env 的 LLM_PROVIDER 选择） */
export function getLLMClient(): OpenAI {
  if (cachedClient) return cachedClient;
  let config = getLLMConfig();
  const provider = (process.env.LLM_PROVIDER ?? "deepseek").toLowerCase();
  if (provider !== "ollama" && !config.apiKey) {
    loadEnv();
    config = getLLMConfig();
  }
  if (provider !== "ollama" && !config.apiKey) {
    throw new Error(
      "未配置大模型 API Key。请在项目根目录 .env 中设置 LLM_PROVIDER（如 deepseek）及对应 Key（如 DEEPSEEK_API_KEY）。"
    );
  }
  cachedClient = new OpenAI({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  return cachedClient;
}

export { getLLMConfig };
