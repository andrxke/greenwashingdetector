import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            EcoClaim <span className="text-accent">Auditor</span>
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/app" className="text-slate-300 transition-colors hover:text-white">
            Launch Auditor
          </Link>
          <a
            href="https://hackthenorth.com"
            target="_blank"
            rel="noreferrer"
            className="hidden text-slate-500 transition-colors hover:text-slate-300 sm:inline"
          >
            Hack the North 2026
          </a>
        </nav>
      </div>
    </header>
  );
}
