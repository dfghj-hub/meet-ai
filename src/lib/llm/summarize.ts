import { getLLMClient, getLLMConfig } from "@/lib/llm/client";
import type { SummarizeResult } from "@/lib/types";

const SYSTEM_PROMPT = `你是一个会议纪要助手。根据用户提供的会议记录或转写稿，输出结构化的会议纪要。

要求：
1. summary：用 2-4 句话概括会议主题、主要结论和下一步。
2. actionItems：待办列表，每项包含 owner（负责人）、task（具体事项）、due（截止时间，若有则填，格式如「本周五前」或「下周一」）。
3. minutes：完整会议纪要，按话题或时间分段，便于阅读和存档。

只输出合法的 JSON，不要包含 markdown 代码块或其它说明文字。JSON 格式如下：
{"summary":"...","actionItems":[{"owner":"...","task":"...","due":"..."}],"minutes":"..."}`;

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  const codeBlock = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (codeBlock) return codeBlock[1].trim();
  return trimmed;
}

export async function summarizeMeetingTranscript(
  text: string
): Promise<SummarizeResult> {
  const client = getLLMClient();
  const config = getLLMConfig();

  const completion = config.supportsJsonMode
    ? await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      })
    : await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("模型未返回内容");
  }

  const jsonStr = config.supportsJsonMode ? raw : extractJson(raw);
  let parsed: SummarizeResult;
  try {
    parsed = JSON.parse(jsonStr) as SummarizeResult;
  } catch {
    throw new Error("模型返回的不是合法 JSON，请尝试更换模型或 provider");
  }

  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.actionItems) ||
    typeof parsed.minutes !== "string"
  ) {
    throw new Error("模型返回格式不符合约定（需 summary、actionItems、minutes）");
  }

  return {
    summary: parsed.summary,
    actionItems: parsed.actionItems.map((item) => ({
      owner: String(item.owner ?? ""),
      task: String(item.task ?? ""),
      due: item.due != null ? String(item.due) : undefined,
    })),
    minutes: parsed.minutes,
  };
}
