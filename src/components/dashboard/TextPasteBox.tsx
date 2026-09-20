"use client";

import { Type } from "lucide-react";

interface TextPasteBoxProps {
  text: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}

const CHAR_LIMIT = 30000;

export function TextPasteBox({ text, onChange, disabled }: TextPasteBoxProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="text-input" className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <Type className="h-4 w-4" />
        Paste ad copy, social post, or marketing statement
      </label>
      <textarea
        id="text-input"
        value={text}
        disabled={disabled}
        maxLength={CHAR_LIMIT}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'e.g. "Our new packaging is 100% sustainable and eco-friendly for a greener future."'}
        rows={8}
        className="w-full resize-y rounded-xl border border-white/10 bg-base-900/70 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
      />
      <div className="flex justify-end text-xs text-slate-600">
        {text.length.toLocaleString()} / {CHAR_LIMIT.toLocaleString()} characters
      </div>
    </div>
  );
}
