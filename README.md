# 会议纪要助手（方案 A）

上传会议录音或粘贴文字稿，一分钟内得到摘要、待办和可复制的纪要。

## 技术栈

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- 部署：Vercel
- 阶段 4 起：Supabase (Auth + PostgreSQL)

## 大模型（摘要）与语音转写

- **摘要**：默认使用 **DeepSeek**（可改为 openai / groq / ollama），通过 `LLM_PROVIDER` 和对应 Key 配置。
- **语音转写**：仅「上传录音」时需要，使用 **Whisper**，需单独配置 `OPENAI_API_KEY`，与摘要用的大模型无关。
- **图片 OCR**：`FileFlow` 上传图片（png/jpg/webp）时使用 OpenAI 视觉能力提取文本，需配置 `OPENAI_API_KEY`。

| LLM_PROVIDER | 说明 | 成本 | 必填 Key |
|--------------|------|------|----------|
| `deepseek`（默认） | 国产，新用户有免费额度 | 低价/免费 | `DEEPSEEK_API_KEY` |
| `ollama` | 本地运行 | **免费** | 无（本地 `ollama run qwen2.5:7b`） |
| `groq` | 海外，有免费额度 | 免费额度 | `GROQ_API_KEY` |
| `openai` | 官方 GPT | 付费 | `OPENAI_API_KEY` |

只填 `LLM_PROVIDER=deepseek` 和 `DEEPSEEK_API_KEY` 即可用「粘贴文字稿」；上传录音还需 `OPENAI_API_KEY`（Whisper）和 `BLOB_READ_WRITE_TOKEN`。

## 环境变量

复制 `.env.example` 为 `.env`，按所选 `LLM_PROVIDER` 填写对应 Key；其余见下表。

| 变量 | 用途 | 获取方式 |
|------|------|----------|
| `LLM_PROVIDER` | 摘要大模型：`deepseek`（默认）/ `openai` / `groq` / `ollama` | 见上表 |
| `DEEPSEEK_API_KEY` | DeepSeek 摘要（默认 provider） | DeepSeek 开放平台 |
| `OPENAI_API_KEY` | 语音转写（Whisper）/ 图片 OCR / LLM_PROVIDER=openai 时摘要 | OpenAI 控制台 |
| `GROQ_API_KEY` | Groq 摘要（当 LLM_PROVIDER=groq） | Groq 控制台 |
| `NEXT_PUBLIC_SUPABASE_URL` 等 | 阶段 4 登录与用量 | Supabase 项目 Settings → API |
| `BLOB_READ_WRITE_TOKEN` | 上传录音的临时存储 | Vercel → Storage → Blob |

- 仅「粘贴文字」且用 **Ollama**：可不填任何 Key，本地运行 `ollama run qwen2.5:7b` 即可。
- 使用「上传录音」：需 `OPENAI_API_KEY`（Whisper）和 `BLOB_READ_WRITE_TOKEN`。
- 使用 `FileFlow` 图片 OCR：需 `OPENAI_API_KEY`。

## 项目结构（便于维护）

```
src/
  app/                    # 路由与 API
    api/                  # 接口：summarize, upload, process-audio
    page.tsx, layout.tsx
  components/             # 按功能分类
    summary/              # 纪要结果展示、复制、下载
  config/                 # 环境与常量
    llm.ts                # 大模型 provider 配置
  lib/                    # 业务逻辑
    llm/                  # 摘要：client、summarize
    transcribe.ts         # 语音转写（Whisper）
    types.ts              # API 契约类型
docs/
  plans/                  # 开发计划（任务级）
  README.md               # 文档索引
  NEXT_PHASES.md          # 后续阶段目标（当前→下一步）
```

产品方案与阶段目标详见 [docs/README.md](docs/README.md)。

## 开发

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 。开发服务器固定使用 **3000** 端口；若提示端口被占用，请先关掉其他终端的 `npm run dev` 再运行。

## 构建与部署

```bash
npm run build
npm run start
```

部署到 Vercel：关联 Git 仓库后，在项目 Settings → Environment Variables 中配置与 `.env.example` 同名的变量。

## 开发计划与后续阶段

- **任务级开发计划**：[docs/plans/2025-02-22-meeting-assistant-implementation-plan.md](docs/plans/2025-02-22-meeting-assistant-implementation-plan.md)
- **后续阶段目标**（阶段 3–6 要做啥、何时做）：[docs/NEXT_PHASES.md](docs/NEXT_PHASES.md)
