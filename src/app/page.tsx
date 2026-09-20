import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, FileSearch, Gauge, Leaf, ScanSearch, ShieldCheck } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: ScanSearch,
    title: "Multi-Source Ingestion",
    description: "Paste a URL, upload an ESG PDF, or drop in raw marketing copy - one unified audit pipeline."
  },
  {
    icon: Gauge,
    title: "Quantified Risk Score",
    description: "A 0\u2013100 Greenwashing Risk Score with Low / Moderate / High / Critical classification."
  },
  {
    icon: AlertTriangle,
    title: "Claim-by-Claim Breakdown",
    description: "Every deceptive phrase flagged, critiqued, and mapped to real regulatory frameworks."
  },
  {
    icon: FileSearch,
    title: "Missing Metrics Detection",
    description: "Surfaces the quantifiable data companies conveniently leave out of their reports."
  }
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
            <Leaf className="h-3.5 w-3.5" />
            Hack the North 2026
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
            Expose greenwashing with
            <br />
            <span className="bg-gradient-to-r from-accent to-emerald-300 bg-clip-text text-transparent">
              AI-powered auditing
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            EcoClaim Auditor scans corporate websites, ESG reports, and marketing copy to flag
            unsubstantiated environmental claims, compute a Greenwashing Risk Score, and generate
            compliant, honest alternative copy - in seconds.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/app">
              <Button size="lg" icon={<ShieldCheck className="h-5 w-5" />}>
                Launch the Auditor
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass-panel p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 border border-accent/30">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
