import { getLLMClient, getLLMConfig } from "@/lib/llm/client";

/**
 * Generic LLM text completion — shared across all tools.
 * Returns the raw string from the model.
 */
export async function llmGenerate(
  systemPrompt: string,
  userMessage: string,
  options?: { json?: boolean; temperature?: number }
): Promise<string> {
  const client = getLLMClient();
  const config = getLLMConfig();
  const useJson = options?.json && config.supportsJsonMode;

  const completion = useJson
    ? await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: options?.temperature ?? 0.7,
        response_format: { type: "json_object" },
      })
    : await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: options?.temperature ?? 0.7,
      });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("模型未返回内容");
  return raw;
}
