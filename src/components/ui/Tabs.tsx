"use client";

import { cx } from "@/lib/utils";
import type { ReactNode } from "react";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  activeId: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ items, activeId, onChange }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 bg-base-900/60 p-1.5">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cx(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 min-w-[140px]",
              isActive
                ? "bg-accent text-base-950 shadow-glow"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
