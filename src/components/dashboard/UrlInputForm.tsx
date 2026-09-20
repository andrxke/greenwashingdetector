"use client";

import { Link2 } from "lucide-react";

interface UrlInputFormProps {
  url: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function UrlInputForm({ url, onChange, disabled }: UrlInputFormProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="url-input" className="text-sm font-medium text-slate-300">
        Corporate landing page or sustainability page URL
      </label>
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id="url-input"
          type="url"
          inputMode="url"
          value={url}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/sustainability"
          className="w-full rounded-xl border border-white/10 bg-base-900/70 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
        />
      </div>
      <p className="text-xs text-slate-500">
        We&apos;ll fetch the page server-side and extract sustainability-related copy for auditing.
      </p>
    </div>
  );
}
