# 交接备忘（2025-02-22 → 下次开发）

## 当前状态：本地可运行，文字摘要功能已通

- 开发服务器：`cd /Users/dd/unknown && npm run dev`（固定 3000 端口）
- 大模型：DeepSeek（`deepseek-chat`），API Key 已配置在 `.env`
- 已验证：`/api/debug-env` 确认 Key 加载正常

## 已完成的阶段

| 阶段 | 内容 | 状态 |
|------|------|------|
| **0 - 项目初始化** | Next.js 14 + Tailwind + TypeScript、`.env.example`、README | 完成 |
| **1 - 文字摘要 MVP** | 粘贴文字 → DeepSeek 生成摘要/待办/纪要 → 复制/下载 | 完成 |
| **2 - 录音处理** | 上传音频 → Whisper 转写 → DeepSeek 摘要（同步流程） | 代码完成，需 `OPENAI_API_KEY` 才能实际使用 |
| **环境调通** | DeepSeek 作为默认 Provider、多 Provider 切换、dotenv override 修复 | 完成 |

## 核心文件一览

```
src/
├── app/
│   ├── page.tsx                    # 主页面（文字粘贴 + 录音上传两个 Tab）
│   ├── layout.tsx                  # 全局 Layout
│   └── api/
│       ├── summarize/route.ts      # POST：文字 → 摘要
│       ├── upload/route.ts         # POST：音频上传到 Vercel Blob
│       ├── process-audio/route.ts  # POST：音频转写 + 摘要
│       └── debug-env/route.ts      # GET：诊断环境变量（可删）
├── components/
│   └── summary/SummaryResult.tsx   # 结果展示组件
├── config/
│   └── llm.ts                      # LLM Provider 配置 + loadEnv()
└── lib/
    ├── types.ts                    # 共享类型定义
    ├── transcribe.ts               # Whisper 转写
    └── llm/
        ├── client.ts               # OpenAI-compatible 客户端
        ├── summarize.ts            # 摘要 Prompt + 调用逻辑
        └── index.ts                # 导出
```

## 明天接着做什么

### 优先级 1：端到端验证
1. 打开 http://localhost:3000 ，粘贴一段会议文字，点「生成摘要」，确认 DeepSeek 返回正常结果
2. 检查结果页的复制、下载功能是否正常
3. 如果有问题，先修 bug 再往下

### 优先级 2：进入阶段 3（内测与部署）
按 `docs/NEXT_PHASES.md` 的建议：
1. **部署到 Vercel**：`git init` → 推到 GitHub → 连接 Vercel → 在 Vercel 环境变量中填 `LLM_PROVIDER=deepseek` + `DEEPSEEK_API_KEY=...`
2. **发给 10-20 人试用**：收集反馈（愿不愿意付费、最缺什么功能）
3. **清理**：删除 `/api/debug-env`（仅调试用）

### 优先级 3：后续阶段概览
- **阶段 4**：登录 + 免费额度 + 付费入口（Supabase Auth + 用量表）
- **阶段 5**：结果页打磨 + SEO + 内容推广
- **阶段 6**：数据复盘与迭代

## 需要注意的坑

| 问题 | 解决方案 |
|------|----------|
| `.env` 修改后不生效 | 必须重启 `npm run dev`；代码已加 `dotenv override: true` 作为兜底 |
| 端口 3000 被占 | `lsof -ti :3000 \| xargs kill -9` 然后重新 `npm run dev` |
| 录音功能需要 `OPENAI_API_KEY` | 在 `.env` 中填 `OPENAI_API_KEY=sk-...`（Whisper 转写用，需 OpenAI 付费账户） |
| 部署到 Vercel 后上传需要 `BLOB_READ_WRITE_TOKEN` | 在 Vercel 项目设置中添加 Vercel Blob 存储 |

## 相关文档
- 开发计划：`docs/plans/2025-02-22-meeting-assistant-implementation-plan.md`
- 后续阶段：`docs/NEXT_PHASES.md`
- 产品方案：`网页优先-AI产品变现方案.md`
