# File Flow V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship FileFlow v1 (text file input -> structured summary -> key points -> action items -> execution package + verification card).

**Architecture:** Add one API endpoint (`/api/file-flow`) that accepts multipart file upload, extracts text, and uses existing LLM structured output pipeline. Add one new page (`/file-flow`) and wire to portal entries.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing `llmGenerate`.

---

### Task 1: API endpoint
- Create `src/app/api/file-flow/route.ts`
- Validate file presence/size
- Extract text (`file.text()`)
- Generate structured JSON via LLM

### Task 2: Frontend page
- Create `src/app/file-flow/page.tsx`
- Upload + loading + result sections
- Copy export pack + show verification card

### Task 3: Entry integration
- Update homepage and feature detail page
- Add `teal` variant to `ToolCard`

### Task 4: Validation
- Run `npm run lint && npm run build`

### Task 5: OCR extension
- Add image OCR support (`png/jpg/jpeg/webp`) in file extraction layer
- Reuse `OPENAI_API_KEY` for OCR path
- Keep unsupported file formats rejected with safe errors
