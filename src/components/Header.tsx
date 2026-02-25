"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/generate", label: "生成内容" },
  { href: "/brand", label: "品牌语音" },
  { href: "/pricing", label: "定价" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-[#0a0a12]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="font-heading text-lg font-semibold tracking-tight text-white">
          Sell<span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">Boost</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:bg-surface-hover hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="md:hidden rounded-lg p-2 text-gray-400 hover:bg-surface-hover hover:text-white"
          onClick={() => setOpen((o) => !o)}
          aria-label="打开菜单"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-surface-border bg-[#0a0a12] px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === href
                    ? "bg-white/10 text-white"
                    : "text-gray-300 hover:bg-surface-hover hover:text-white"
                }`}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
