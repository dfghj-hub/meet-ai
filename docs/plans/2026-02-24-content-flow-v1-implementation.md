# Content Flow V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship P0 "内容发布任务流 v1" with script generation, multi-platform rewrite output, publishing checklist, and a human-verifiable result card.

**Architecture:** Add one new API route (`/api/generate-content-flow`) that returns structured JSON from the existing LLM abstraction, then add one new page (`/content-flow`) that drives the full flow and reuses current visual system components. Wire the new flow into portal entry points.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing `llmGenerate()` infra.

---

### Task 1: Backend route for content flow

**Files:**
- Create: `src/app/api/generate-content-flow/route.ts`
- Modify: `src/lib/safe-error.ts`

**Step 1: Add endpoint**
- Validate `topic` input.
- Reuse `llmGenerate()` with JSON output and strict response schema.

**Step 2: Add safe error prefix**
- Extend `SAFE_PREFIXES` for flow fallback message.

**Step 3: Manual sanity check**
- Run local request against endpoint and verify shape:
  - `script`
  - `rewrites[]`
  - `checklist[]`
  - `verification.{basis,risks,checkpoints}`

---

### Task 2: Frontend page for full flow

**Files:**
- Create: `src/app/content-flow/page.tsx`
- Create: `src/components/flow/VerifiedResultCard.tsx`

**Step 1: Input stage**
- Add topic textarea, duration/style/platform selectors, submit action.

**Step 2: Loading and result stage**
- Reuse `LoadingSpinner`.
- Render script block, rewrite cards, checklist list.
- Add copy-to-clipboard per output block.

**Step 3: Human checkpoint UI**
- Add `VerifiedResultCard` with basis, risks, checkpoints.
- Provide "重生成" and "回退上一步" controls.

---

### Task 3: Entry integration

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/features/page.tsx`
- Modify: `src/components/portal/ToolCard.tsx`
- Modify: `src/components/Header.tsx`

**Step 1: Add new portal card**
- Surface `FlowAI` on homepage.

**Step 2: Add feature doc section**
- Include detailed sections for new flow in `features` page.

**Step 3: Add style variant**
- Extend `ToolCard` variant type with `violet`.

**Step 4: Header neutralization**
- Rename fixed header brand text to `ToolsAI`.

---

### Task 4: Verification

**Files:**
- N/A

**Step 1: Run lint**
- Command: `npm run lint`

**Step 2: Fix issues**
- Address any TypeScript/ESLint errors introduced by this feature.

**Step 3: Final smoke pass**
- Open `/content-flow`, run one full generation, confirm UI and copy behavior.
