import { Leaf } from "lucide-react";

interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Running audit…" }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/30" />
        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 border border-accent/40">
          <Leaf className="h-7 w-7 text-accent animate-pulse-slow" />
        </span>
      </div>
      <div>
        <p className="font-medium text-slate-200">{label}</p>
        <p className="mt-1 text-sm text-slate-500">Cross-referencing claims against compliance frameworks…</p>
      </div>
    </div>
  );
}
