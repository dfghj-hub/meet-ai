"use client";

import { useState } from "react";

interface FlowFeedbackProps {
  flow: string;
  sessionId?: string;
}

const STAR_LABELS = ["很差", "不满意", "一般", "满意", "非常满意"];

export function FlowFeedback({ flow, sessionId }: FlowFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (rating < 1 || sending) return;
    setSending(true);
    try {
      const sid =
        sessionId ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("toolsai_analytics_session_id_v1") ?? "anonymous"
          : "anonymous");

      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow,
          rating,
          comment: comment.trim(),
          sessionId: sid,
        }),
      });
      setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  if (submitted) {
    return (
      <section className="glass-card p-4">
        <div className="flex items-center gap-2 text-sm text-emerald-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          感谢反馈！你的评价将帮助我们持续改进。
        </div>
      </section>
    );
  }

  const active = hovered || rating;

  return (
    <section className="glass-card p-5">
      <h3 className="mb-1 font-heading text-sm font-semibold text-white">
        对本次结果满意吗？
      </h3>
      <p className="mb-3 text-xs text-gray-400">你的反馈将直接影响功能优化方向</p>

      <div className="mb-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="group p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} 星 - ${STAR_LABELS[star - 1]}`}
          >
            <svg
              className={`h-7 w-7 transition-colors ${
                star <= active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-gray-500 group-hover:text-gray-400"
              }`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
        {active > 0 && (
          <span className="ml-2 text-xs text-gray-400">{STAR_LABELS[active - 1]}</span>
        )}
      </div>

      {rating > 0 && (
        <div className="animate-slide-up">
          <textarea
            rows={2}
            className="input-glass mb-3 resize-none text-sm"
            placeholder="有什么具体建议？（可选）"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={sending}
            className="btn-primary text-sm"
          >
            {sending ? "提交中…" : "提交反馈"}
          </button>
        </div>
      )}
    </section>
  );
}
