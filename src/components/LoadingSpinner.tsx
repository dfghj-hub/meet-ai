"use client";

interface LoadingSpinnerProps {
  stage?: string | null;
}

export function LoadingSpinner({ stage }: LoadingSpinnerProps) {
  return (
    <div className="glass-card flex flex-col items-center justify-center py-20 animate-slide-up">
      {/* Spinning gradient ring */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-spin-gradient rounded-full bg-gradient-primary opacity-20 blur-md" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-indigo-500 border-l-purple-500" />
        <div className="absolute inset-2 rounded-full bg-[#0a0a12]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-gradient-primary animate-pulse-soft" />
        </div>
      </div>

      {/* Stage text */}
      <p className="mt-6 font-heading text-sm font-semibold text-gray-300">
        {stage ?? "AI 正在分析…"}
      </p>

      {/* Bouncing dots */}
      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-indigo-400"
            style={{
              animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500">
        通常需要 10-30 秒，请耐心等待
      </p>
    </div>
  );
}
