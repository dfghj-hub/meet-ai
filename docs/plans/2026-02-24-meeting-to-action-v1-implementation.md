# Meeting To Action V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade existing meeting summarization flow into "会议到执行任务流 v1" with editable action items, verification card, and execution package export.

**Architecture:** Reuse existing summarize/transcribe APIs and focus iteration on result-layer UX by replacing legacy output component with a task-flow oriented result component.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, existing `/api/summarize`, `/api/upload`, `/api/process-audio`.

---

### Task 1: Build task-flow result component

**Files:**
- Create: `src/components/flow/MeetingFlowResult.tsx`

**Steps:**
1. Render summary section with copy action.
2. Render editable action-item rows (owner/task/due).
3. Render execution package block and export `.txt`.
4. Attach `VerifiedResultCard` as human checkpoint.

---

### Task 2: Wire page to new result layer

**Files:**
- Modify: `src/app/meeting/page.tsx`

**Steps:**
1. Replace old `SummaryResult` usage with `MeetingFlowResult`.
2. Keep existing request flow for text/audio unchanged.

---

### Task 3: Align portal messaging

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/features/page.tsx`

**Steps:**
1. Update homepage card copy from "纪要助手" to "会议到执行任务流".
2. Update feature detail copy for editable action items and execution package.

---

### Task 4: Verify

**Files:**
- N/A

**Steps:**
1. Run `npm run lint`.
2. Smoke test `/meeting` with text + audio path.
