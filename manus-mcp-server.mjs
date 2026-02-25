import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import OpenAI from "openai";

const baseURL = process.env.MANUS_BASE_URL || "https://api.manus.ai/v1";
const apiKey = process.env.MANUS_API_KEY || "";
const model = process.env.MANUS_MODEL || "manus";

if (!apiKey) {
  console.error("Missing MANUS_API_KEY in MCP server environment.");
}

const client = new OpenAI({
  apiKey: apiKey || "missing-key",
  baseURL,
});

const server = new Server(
  {
    name: "manus-ui-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "manus_generate_ui",
        description:
          "Generate polished UI specs/code from product requirements using Manus model. Return structured output for direct implementation.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Detailed UI/product design request in Chinese or English.",
            },
            outputMode: {
              type: "string",
              enum: ["spec", "react_tailwind", "both"],
              description:
                "spec: IA + UX spec; react_tailwind: code only; both: spec + code",
            },
          },
          required: ["prompt"],
          additionalProperties: false,
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== "manus_generate_ui") {
    throw new Error(`Unknown tool: ${name}`);
  }

  const prompt = typeof args?.prompt === "string" ? args.prompt : "";
  const outputMode =
    typeof args?.outputMode === "string" ? args.outputMode : "both";

  if (!prompt.trim()) {
    return {
      content: [
        {
          type: "text",
          text: "prompt 不能为空",
        },
      ],
      isError: true,
    };
  }

  const systemPrompt = [
    "You are Manus UI Design Assistant.",
    "Output practical, production-ready results for a React + Tailwind project.",
    "Always prioritize conversion-oriented UX and clean information hierarchy.",
    "If outputMode=spec: return IA + layout + states + component list.",
    "If outputMode=react_tailwind: return React + Tailwind code blocks only.",
    "If outputMode=both: return spec first, then code.",
  ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `outputMode=${outputMode}\n\n${prompt}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() || "";
    return {
      content: [
        {
          type: "text",
          text: text || "Manus returned empty output.",
        },
      ],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown Manus API error";
    return {
      content: [
        {
          type: "text",
          text: `Manus API 调用失败: ${msg}`,
        },
      ],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
