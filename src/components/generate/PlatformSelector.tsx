"use client";

import { PLATFORM_RULES } from "@/lib/platforms";
import type { PlatformId } from "@/lib/platforms";

interface PlatformSelectorProps {
  selected: PlatformId[];
  onChange: (ids: PlatformId[]) => void;
}

const ALL_IDS: PlatformId[] = ["xiaohongshu", "douyin", "wechat", "bilibili", "kuaishou"];

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  function toggle(id: PlatformId) {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-300">选择平台</p>
      <div className="flex flex-wrap gap-3">
        {ALL_IDS.map((id) => {
          const r = PLATFORM_RULES[id];
          const checked = selected.includes(id);
          return (
            <label
              key={id}
              className="glass-card flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(id)}
                className="h-4 w-4 rounded border-surface-border bg-surface text-orange-500 focus:ring-orange-500/50"
              />
              <span className="text-xl">{r.icon}</span>
              <span className="text-sm text-white">{r.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
