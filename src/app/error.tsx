"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="glass-card max-w-md p-8 text-center">
        <h1 className="font-heading text-xl font-bold text-white">出错了</h1>
        <p className="mt-2 text-sm text-gray-400">
          页面遇到问题，请重试或返回首页。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-primary">
            重试
          </button>
          <Link href="/" className="btn-ghost">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
