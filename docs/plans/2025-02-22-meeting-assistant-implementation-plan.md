# 会议助手（方案 A）详细开发计划

> **For Claude:** 执行本计划时，可使用 superpowers:executing-plans 按任务逐步执行，或使用 superpowers:subagent-driven-development 在本会话中派发子 agent 逐任务实现；多阶段内标注「可并行」的任务可用多个 agent 同时推进。

**目标：** 做一个「上传会议录音或粘贴文字稿 → 得到摘要、待办、可复制/下载的纪要」的网页产品，先无登录验证需求，再接入登录与付费。

**架构：** 前端 Next.js (App Router) + Tailwind，部署 Vercel；后端 Next.js API Routes；语音转写用国内 API（阿里/讯飞）或 Whisper；文本摘要与结构化用大模型（GPT-4o-mini 或国产）；用户与用量用 Supabase（Auth + Postgres）。音频临时存 Vercel Blob，处理完即删。

**技术栈：** Next.js 14+ (App Router), React, Tailwind CSS, Supabase (Auth + PostgreSQL), Vercel (Hosting + Blob), OpenAI API 或国产大模型, 阿里云/讯飞 语音转写 API（或 Whisper）。

**参考文档：** 本仓库根目录 `网页优先-AI产品变现方案.md` 内「方案 A」及「方案 A 深化」全文。

---

## 执行记录

| 日期 | 阶段 | 完成内容 |
|------|------|----------|
| 2025-02-22 | 0 | Next.js 项目初始化（手动搭建）、`.env.example`、README 环境变量说明、`npm run build` 通过 |
| 2025-02-22 | 1 | `POST /api/summarize`、`src/lib/llm.ts`、前端单页「粘贴→结果」、摘要/待办/纪要展示、复制与下载 .txt/.md |
| 2025-02-22 | 2 | `POST /api/upload`（Vercel Blob）、`src/lib/transcribe.ts`（Whisper）、`POST /api/process-audio`（同步），前端「上传录音」Tab、上传→处理→结果流程。注：阶段 2 采用同步方案（无 job 轮询），长会议可后续加异步 jobs |
| 2025-02-22 | 环境调通 | LLM 改为 DeepSeek（默认）；添加多 Provider 支持（DeepSeek/OpenAI/Groq/Ollama）；`dotenv` override 修复；本地 `npm run dev` + DeepSeek API Key 验证通过 |

---

## 多 Agent 分工总览

| 阶段 | 可并行组 | 说明 |
|------|----------|------|
| 阶段 0 | 无 | 必须最先完成，其余依赖此环境 |
| 阶段 1 | **A** API 设计+实现 / **B** 前端单页 | 约定好 API 契约后，A 与 B 可同时进行 |
| 阶段 2 | **A** 上传+转写+串联 / **B** 前端上传与状态 | 约定「上传→jobId→轮询结果」契约后并行 |
| 阶段 3 | 无（人工为主） | 内测与反馈收集 |
| 阶段 4 | **A** Supabase 与用量 / **B** 定价页与支付入口 | 先定用量接口，再并行 |
| 阶段 5 | **A** 结果页与下载 / **B** 内容与 SEO | 互不依赖 |
| 阶段 6 | 无 | 数据复盘与迭代决策 |

---

## 阶段 0：项目与环境初始化

**目标：** 本地与线上可运行的空项目，环境变量占位，无业务逻辑。

**产出：** 可 `npm run dev` 跑起的 Next.js 项目；已接 Vercel（可选）；`.env.example` 与文档说明。

### Task 0.1：初始化 Next.js 项目

**步骤：**
1. 在项目根目录执行：`npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias`（或按最新 create-next-app 交互选择 App Router、TypeScript、Tailwind）。
2. 确认 `src/app/layout.tsx`、`src/app/page.tsx` 存在且可访问。
3. 运行 `npm run dev`，浏览器打开 `http://localhost:3000` 可见默认页。
4. 在根目录创建 `.env.example`，内容包含占位（无真实密钥）：
   - `OPENAI_API_KEY=` 或 `LLM_API_KEY=`（大模型）
   - `TRANSCRIPTION_API_KEY=` 或 `ALIYUN_*` / `XUNFEI_*`（语音转写，按后续选定供应商填写）
   - `NEXT_PUBLIC_SUPABASE_URL=`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
   - `SUPABASE_SERVICE_ROLE_KEY=`（若阶段 4 用）
5. 将 `.env.example` 加入版本控制；`.env` 加入 `.gitignore`（若尚未忽略）。
6. 在 `README.md` 或 `docs/README.md` 中增加「环境变量」小节，说明各变量用途及从哪里获取。

**验收：** 新 clone 后 `cp .env.example .env` 填假值也可 `npm run build` 通过（若 build 里不读密钥）；`npm run dev` 正常。

---

### Task 0.2：Vercel 与仓库关联（可选）

**步骤：**
1. 将代码推送到 GitHub/GitLab（若尚未）。
2. 在 Vercel 创建新项目并导入该仓库。
3. 在 Vercel 项目 Settings → Environment Variables 中配置与 `.env.example` 同名的占位（后续替换为真实值）。
4. 部署一次，确认生产 URL 可访问默认首页。

**验收：** 推送 main 后 Vercel 自动部署成功，访问生产 URL 看到与本地一致的首页。

---

## 阶段 1：文字稿 → 摘要 + 待办 + 纪要（无登录）

**目标：** 用户粘贴一段会议文字稿，后端用大模型生成「一段话摘要、待办列表、完整纪要」，前端展示并可复制/下载。无登录、无限次（仅用于验证）。

**产出：** 单页可用的「粘贴 → 提交 → 看结果」流程；API 契约稳定，便于阶段 2 复用。

### API 契约（阶段 1 & 2 共用）

- **POST** `/api/summarize`
  - **Request body:** `{ "text": string }`（必填，最长建议 100k 字符）
  - **Response 200:**  
    `{ "summary": string, "actionItems": { "owner": string, "task": string, "due?: string }[], "minutes": string }`
  - **Response 4xx/5xx:** 标准 JSON 错误 `{ "error": string }`

### Task 1.1：实现 POST /api/summarize（仅文本）

**文件：**
- 新建：`src/app/api/summarize/route.ts`
- 可选：`src/lib/llm.ts`（封装调用大模型的函数）

**步骤：**
1. 在 `src/lib/llm.ts` 中实现 `summarizeMeetingTranscript(text: string): Promise<{ summary, actionItems, minutes }>`：
   - 调用 OpenAI API（或国产大模型）使用结构化输出（JSON mode 或 parse 固定格式）。
   - System prompt 明确要求：输出一段话摘要（2–4 句）、待办列表（每条含负责方、事项、可选截止时间）、完整纪要（按话题或时间分段）。
   - 将返回内容解析为上述类型并返回。
2. 在 `src/app/api/summarize/route.ts` 中：读取 body 的 `text`，校验非空且长度在限制内；调用 `summarizeMeetingTranscript(text)`；返回 JSON。错误时返回 400/500 与 `{ error: "..." }`。
3. 使用 Postman 或 curl 用一段中文会议稿测试，确认返回结构符合契约。

**验收：** 对示例文字稿请求 POST /api/summarize，响应为 200 且包含 `summary`、`actionItems`、`minutes` 三个字段，内容合理。

---

### Task 1.2：前端单页「粘贴 → 结果」

**文件：**
- 修改/新建：`src/app/page.tsx`（或 `src/app/summarize/page.tsx` 作为主流程页，首页可仅保留入口）
- 可选：`src/components/SummaryResult.tsx`、`src/components/ActionItemsList.tsx`

**步骤：**
1. 页面包含：大文本框（placeholder：「粘贴会议记录或转写稿」）、提交按钮、加载状态。
2. 提交时 POST `/api/summarize`，body `{ text }`；请求期间禁用按钮并显示「生成中…」。
3. 成功后在页面展示：摘要（可单独复制）、待办列表（表格或列表，每行：负责方 · 事项 · 截止）、完整纪要（可折叠）。
4. 提供按钮：「复制摘要」「复制全部待办」「复制全文」「下载 .txt」「下载 .md」。
5. 错误时展示接口返回的 `error` 或友好提示。

**验收：** 粘贴一段文字 → 点击提交 → 看到摘要/待办/纪要 → 复制与下载功能可用。

**并行说明：** Task 1.1 与 1.2 可在约定上述 API 契约后由不同 agent 同时开发；前端可先 mock 返回数据结构。

---

## 阶段 2：音频上传 → 转写 → 摘要（无登录）

**目标：** 用户上传一个会议录音文件（mp3/wav/m4a），后端转写为文字后复用阶段 1 的摘要逻辑，前端展示「处理中」再展示结果。单文件限制（如 25MB 或 30 分钟）。

**产出：** 完整「上传录音 → 转写 → 纪要」流程；处理时间较长时采用异步（jobId + 轮询或 Webhook 二选一，MVP 建议轮询）。

### Task 2.1：文件上传与临时存储

**文件：**
- 新建：`src/app/api/upload/route.ts`
- 配置：Vercel Blob 或项目内配置的存储（见 Vercel 文档）

**步骤：**
1. 实现 **POST** `/api/upload`：接收 `multipart/form-data` 的 `file` 字段。
2. 校验：文件类型为 `audio/mpeg` / `audio/wav` / `audio/x-m4a` 等；文件大小 ≤ 25MB（可配置）。
3. 将文件上传至 Vercel Blob（或 R2/S3），得到 `url` 或 `path`；返回 `{ uploadId, url }` 或仅 `url` 供后续转写使用。
4. 记录上传时间（内存或简单 KV 即可），用于后续「处理完即删」策略（可在 Task 2.3 完成后统一删）。

**验收：** 用 curl 或前端表单上传一个 ≤25MB 的 mp3，接口返回 200 及可访问的 url 或 id。

---

### Task 2.2：语音转文字集成

**文件：**
- 新建：`src/lib/transcribe.ts`
- 可能新建：`src/lib/transcribe-aliyun.ts` 或 `src/lib/transcribe-openai.ts`（按选定供应商）

**步骤：**
1. 实现 `transcribeAudio(audioUrl: string): Promise<{ text: string, durationMinutes?: number }>`：
   - 从 `audioUrl` 下载或流式读取音频（若供应商要求本地文件，则先下载到临时目录）。
   - 调用阿里云/讯飞/Whisper 的语音转写 API，获取全文。
   - 返回转写文本；若有「时长」可一并返回便于后续按分钟计费。
2. 在 `src/app/api/transcribe/route.ts` 中实现 **POST** `/api/transcribe`：body `{ audioUrl: string }`，调用 `transcribeAudio(audioUrl)`，返回 `{ text, durationMinutes? }`。错误时返回 4xx/5xx 与 `{ error }`。
3. 单文件时长限制：若供应商按分钟计费，在调用前根据 duration 或文件大小估算并拒绝超过 30 分钟的请求（可选，MVP 也可仅用文件大小限制）。

**验收：** 对阶段 2.1 得到的音频 url 调用 POST /api/transcribe，返回可用的 `text`。

---

### Task 2.3：串联「上传 → 转写 → 摘要」并支持异步

**文件：**
- 新建：`src/app/api/jobs/route.ts`（创建任务）
- 新建：`src/app/api/jobs/[jobId]/route.ts`（查询任务状态与结果）
- 可选：`src/lib/job-store.ts`（内存或 Redis/KV 存 job 状态）

**步骤：**
1. **POST** `/api/jobs`：body `{ audioUrl: string }` 或 `{ uploadId: string }`（能定位到音频即可）。
   - 创建 job，状态 `processing`，返回 `{ jobId }`。
   - 异步执行：调用转写 → 调用 `summarizeMeetingTranscript(text)` → 将结果写入 job 存储，状态改为 `completed`；失败则 `failed` 并写入 `error`。
2. **GET** `/api/jobs/[jobId]`：返回 `{ status: "processing" | "completed" | "failed", result?: { summary, actionItems, minutes }, error?: string }`。
3. 可选：任务完成后删除 Blob 上的音频文件以节省空间与合规。
4. 若同步足够快（< 30s），可先实现同步版：POST 直接返回结果，前端不轮询；再在超时或大文件时改为上述异步 + 轮询。

**验收：** 调用 POST /api/jobs 传入音频 url，得到 jobId；轮询 GET /api/jobs/:jobId 直至 status 为 completed，result 与阶段 1 结构一致。

---

### Task 2.4：前端上传页与处理中状态

**文件：**
- 新建或修改：`src/app/page.tsx` 或 `src/app/summarize/page.tsx`；可选 `src/app/upload/page.tsx`
- 复用阶段 1 的结果展示组件

**步骤：**
1. 首页或统一入口提供两个入口：「上传录音」「粘贴文字稿」。粘贴文字稿沿用阶段 1 流程。
2. 上传录音：文件选择/拖拽，限制类型与大小（与 2.1 一致）；提交后调用 POST /api/jobs（或先 POST /api/upload 再 POST /api/jobs 传 url）。
3. 提交后跳转或同页展示「处理中」：显示「转写中 → 分析中」类提示；每 2–3 秒轮询 GET /api/jobs/:jobId，直到 status 为 completed 或 failed。
4. 完成后展示与阶段 1 相同的结果区块（摘要、待办、纪要）及复制/下载按钮；失败时展示 error。
5. 长会议（如 >1 分钟）可在「处理中」提示「长会议请稍候」。

**验收：** 上传一个 5–10 分钟 mp3 → 看到处理中 → 最终看到摘要与待办；复制与下载可用。

**并行说明：** Task 2.1+2.2 可由 Agent A 做；2.3 串联可由 A 或另一 Agent 在 2.1/2.2 完成后做；2.4 前端可与 2.3 并行（约定 jobs API 契约即可）。

---

## 阶段 3：内测与反馈

**目标：** 将当前可用的「文字稿 + 录音」流程发给 10–20 人使用，收集「是否愿意付费、付多少、最缺什么」的反馈，用于决定定价与阶段 4 优先级。

**产出：** 反馈汇总（文档或表格）；可选：简单访问/使用统计（如 Vercel Analytics 或自建埋点）。

### Task 3.1：部署与分享准备

**步骤：**
1. 确认生产环境环境变量已配置（大模型、转写 API、若用 Blob 则 Vercel Blob）。
2. 准备短链接或落地页文案（一句话价值主张 + 使用步骤）。
3. 可选：在页面加「反馈」入口（如 typeform/金数据/Google 表单链接），或留邮箱/微信。

**验收：** 生产 URL 稳定可用；分享文案与反馈链接就绪。

---

### Task 3.2：内测发放与反馈收集

**步骤：**
1. 将链接发给 10–20 位目标用户（产品/销售/自由职业优先）。
2. 收集：是否愿意为「会议→纪要」付费、心理价位、最需要的功能（如按人分段、导出格式、历史记录等）。
3. 将反馈整理成文档（如 `docs/feedback-YYYY-MM.md`），标注「定价建议」「下一版功能优先级」。

**验收：** 至少 10 份有效反馈；文档可被阶段 4/5 直接引用。

---

## 阶段 4：登录 + 免费额度 + 付费入口

**目标：** 用户通过 Supabase Auth 登录；免费用户每月 3 次（或 30 分钟）；用量用尽后展示升级 CTA；付费通过爱发电/面包多/Lemon Squeezy 等接入（首版可手动开通）。

**产出：** 登录/注册流程；用量校验与扣减；定价页与「升级」入口；至少一种支付渠道可完成收款。

### Task 4.1：Supabase 项目与 Auth

**文件：**
- 新建：`src/lib/supabase/client.ts`（浏览器用）、`src/lib/supabase/server.ts`（服务端用，若需）
- 修改：登录/注册页或组件

**步骤：**
1. 在 Supabase 创建项目；在 SQL Editor 中建表（示例）：
   - `profiles`：id (uuid, FK auth.users), email, created_at, updated_at
   - `usage`：user_id (uuid), period_start (date), period_end (date), count_used (int), minutes_used (decimal), 唯一约束 (user_id, period_start)
2. 配置 Auth：启用 Email 或 Magic Link（或 GitHub 等），记录 Redirect URL。
3. 在 Next.js 中集成 @supabase/supabase-js：创建 client（browser）与 server 实例；在需要鉴权的 API 与页面中获取当前 user。
4. 实现登录/注册页（或弹窗）：输入邮箱 → 发 Magic Link 或密码登录；登录成功后跳转回产品页。

**验收：** 可注册/登录；刷新后仍为登录状态；API 能拿到当前 user id。

---

### Task 4.2：用量记录与校验

**文件：**
- 新建：`src/lib/usage.ts`（查用量、扣减、是否超限）
- 修改：`src/app/api/summarize/route.ts`、`src/app/api/jobs/route.ts`（或统一中间件）

**步骤：**
1. 实现 `getUsage(userId, period)`：从 `usage` 表读取当前周期（如当月）的 count_used / minutes_used。
2. 实现 `incrementUsage(userId, byCount?, byMinutes?)`：若无当月记录则插入，否则 update count_used/minutes_used。
3. 实现 `canUse(userId, tier)`：免费 tier 为 3 次/月（或 30 分钟/月）；付费 tier 为 30 次/月（或 300 分钟/月）。返回 boolean。
4. 在 `/api/summarize` 与创建 job 的 API 中：若未登录则允许使用但可限制为「匿名仅 1 次」或直接要求登录；若已登录则先 `canUse(userId, tier)`，超限返回 402 或 429 与 `{ error: "QUOTA_EXCEEDED" }`；成功后在返回前 `incrementUsage`。
5. 确定 tier 来源：可从 `profiles` 或单独 `subscriptions` 表读取；首版可写死「所有登录用户为 free」，付费用户由你在 DB 中手动改字段或插入记录。

**验收：** 免费用户第 4 次请求时得到 402/429；用量表正确递增。

---

### Task 4.3：定价页与支付入口

**文件：**
- 新建：`src/app/pricing/page.tsx`
- 修改：结果页或全局导航，在用量用尽时显示「升级」按钮

**步骤：**
1. 定价页内容：免费 3 次/月；个人版 ¥29/月 30 次；年付 ¥199/年。文案与 `网页优先-AI产品变现方案.md` 一致。
2. 「升级」按钮链接到定价页；定价页上「购买」按钮链接到爱发电/面包多/Lemon Squeezy 的对应商品页（或支付链接）。
3. 首版不实现自动开通：用户付款后，你手动在 Supabase 中将该用户标记为付费（或在 `subscriptions` 表插入记录），tier 逻辑在 4.2 中已支持。
4. 可选：在定价页或「升级」弹窗中加「已用 x/3 次」展示（需从 API 拉取当前用量）。

**验收：** 免费用户用完额度后看到升级 CTA；点击进入定价页并可跳转至支付渠道；你手动标记后该用户获得 30 次/月。

**并行说明：** Task 4.1 与 4.2 需先于 4.3；4.3 定价页（静态 + 链接）可与 4.2 并行开发。

---

## 阶段 5：打磨与推广

**目标：** 提升结果页体验（下载格式、复制反馈）；写 1–2 篇内容/SEO 文章带产品链接，获取自然流量。

**产出：** 结果页体验优化；至少 1 篇可对外发布的文章（如「如何高效做会议纪要」+ 产品介绍）。

### Task 5.1：结果页体验与下载

**文件：**
- 修改：结果展示组件、下载逻辑

**步骤：**
1. 确保「下载 .txt」「下载 .md」生成的文件名含日期或会议摘要前几字，避免重复覆盖。
2. 复制后给予 Toast 或文案反馈「已复制」。
3. 可选：纪要区块默认折叠，点击展开；移动端排版优化。

**验收：** 下载文件命名合理；复制有反馈；移动端可读。

---

### Task 5.2：内容与 SEO

**文件：**
- 新建：`src/app/blog/` 或独立站点/Medium/知乎等的一篇文章

**步骤：**
1. 写一篇 1500–3000 字的文章，主题如「如何高效做会议纪要」「会议录音转文字后的 3 个用法」等，文中自然引入产品并附链接。
2. 若放在站内：`src/app/blog/how-to-meeting-notes/page.tsx` 或 MDX；若站外，在文档中记录文章 URL 与发布渠道。
3. 首页或落地页的 meta title/description 包含核心关键词（会议纪要、录音转文字等）。

**验收：** 文章可访问且含产品链接；搜索引擎或站内可发现该页。

**并行说明：** Task 5.1 与 5.2 可由不同 agent 同时进行。

---

## 阶段 6：数据与迭代

**目标：** 根据阶段 3 反馈与阶段 4–5 上线后的数据，决定是否做「历史记录」「按人分段」或调整定价/渠道。

**产出：** 数据看板或周报（注册、用量、付费转化、来源）；迭代决策记录。

### Task 6.1：基础指标与看板

**步骤：**
1. 在 Supabase 或 Vercel 中查询：每日/周注册数、每日/周「成功生成纪要」次数、免费 vs 付费用户数、付费转化率（免费用户中升级比例）。
2. 可选：在关键节点埋点（如「点击升级」「完成支付」）并汇总到简单表格或 Supabase 表。
3. 写一份 `docs/metrics-YYYY-MM.md` 或周报模板，便于定期复盘。

**验收：** 能在一页内看到「本周新增用户、使用次数、付费人数」。

---

### Task 6.2：迭代决策

**步骤：**
1. 根据阶段 3 反馈与 6.1 数据，在 `docs/plans/` 下新增一篇「迭代决策-YYYY-MM.md」：下一版做「历史记录」还是「按人分段」、是否调整免费/付费额度、是否增加支付渠道。
2. 若决定做历史记录：在阶段 4 的 DB 中增加「纪要结果表」，仅存文本与 user_id、created_at；结果页增加「历史记录」入口与列表页。

**验收：** 迭代决策有据可查；若本期不开发新功能，至少文档化「为何不做」。

---

## 执行方式建议

1. **顺序执行（单 agent）：** 按阶段 0 → 1 → 2 → 3 → 4 → 5 → 6 依次完成，每阶段验收后再进入下一阶段。
2. **子 agent 逐任务（本会话）：** 使用 superpowers:subagent-driven-development，每 Task 派发一个 implementer 子 agent，完成后做 spec 与 code review，再进入下一 Task；阶段内「可并行」的 Task 仍建议顺序执行以避免冲突（或先定契约再并行）。
3. **多 agent 并行：** 在阶段 1、2、4、5 中，按「多 Agent 分工总览」表同时派发多个 agent（例如 Agent A 做 API，Agent B 做前端），约定好 API 契约与分支策略，完成后合并并跑通 E2E。

计划完成后，你可先审阅本文件与 `网页优先-AI产品变现方案.md`，确认可行后再开始实现；若需要调整阶段划分或任务粒度，可在本计划上直接修改并保存。
