"use client";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-surface-border pt-8">
      <p className="text-center text-xs tracking-wide text-gray-600">
        © {new Date().getFullYear()} SellBoost · AI 社交电商内容引擎
      </p>
    </footer>
  );
}
