"use client";

interface VerifiedResultCardProps {
  basis: string[];
  risks: string[];
  checkpoints: string[];
  onRegenerate: () => void;
  onBacktrack: () => void;
  onContinue?: () => void;
}

export function VerifiedResultCard({
  basis,
  risks,
  checkpoints,
  onRegenerate,
  onBacktrack,
  onContinue,
}: VerifiedResultCardProps) {
  return (
    <section className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-base font-semibold text-white">可验证结果卡</h3>
          <p className="mt-1 text-xs text-gray-400">
            查看依据与风险后，再决定继续发布或调整。
          </p>
        </div>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          Human Checkpoint
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            依据点
          </p>
          <ul className="space-y-1.5 text-sm text-gray-300">
            {basis.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
            风险提示
          </p>
          <ul className="space-y-1.5 text-sm text-gray-300">
            {risks.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-300">
            人工确认点
          </p>
          <ul className="space-y-1.5 text-sm text-gray-300">
            {checkpoints.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {onContinue && (
          <button type="button" onClick={onContinue} className="btn-primary">
            确认继续
          </button>
        )}
        <button type="button" onClick={onRegenerate} className="btn-ghost">
          重生成
        </button>
        <button type="button" onClick={onBacktrack} className="btn-ghost">
          回退上一步
        </button>
      </div>
    </section>
  );
}
