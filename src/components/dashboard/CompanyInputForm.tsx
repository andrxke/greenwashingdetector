"use client";

import { Building2 } from "lucide-react";

interface CompanyInputFormProps {
  company: string;
  onChange: (company: string) => void;
  disabled?: boolean;
}

export function CompanyInputForm({ company, onChange, disabled }: CompanyInputFormProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="company-input" className="text-sm font-medium text-slate-300">
        Company name
      </label>
      <div className="relative">
        <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          id="company-input"
          type="text"
          value={company}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Example: Patagonia"
          className="w-full rounded-xl border border-white/10 bg-base-900/70 py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors focus:border-accent/60 focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
        />
      </div>
      <p className="text-xs text-slate-500">
        Browserbase will search for official sustainability, ESG, climate, and impact reports.
      </p>
    </div>
  );
}
