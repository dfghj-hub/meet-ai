"use client";

import { useState } from "react";
import type { PlatformContent } from "@/lib/types";
import { CopyVariantCard } from "./CopyVariantCard";

interface PlatformResultTabsProps {
  platforms: PlatformContent[];
}

export function PlatformResultTabs({ platforms }: PlatformResultTabsProps) {
  const [activeId, setActiveId] = useState(platforms[0]?.platformId ?? "");

  const active = platforms.find((p) => p.platformId === activeId) ?? platforms[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-surface-border pb-2">
        {platforms.map((p) => (
          <button
            key={p.platformId}
            type="button"
            onClick={() => setActiveId(p.platformId)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeId === p.platformId
                ? "bg-orange-500/20 text-orange-300"
                : "text-gray-400 hover:bg-surface-hover hover:text-white"
            }`}
          >
            {p.platformName}
          </button>
        ))}
      </div>
      {active && (
        <div className="grid gap-4 md:grid-cols-3">
          {active.variants.map((v) => (
            <CopyVariantCard key={v.id} variant={v} />
          ))}
        </div>
      )}
    </div>
  );
}
