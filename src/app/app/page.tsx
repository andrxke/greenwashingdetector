"use client";

import { InputTabs } from "@/components/dashboard/InputTabs";
import { PdfDropzone } from "@/components/dashboard/PdfDropzone";
import { SampleCaseButton } from "@/components/dashboard/SampleCaseButton";
import { TextPasteBox } from "@/components/dashboard/TextPasteBox";
import { UrlInputForm } from "@/components/dashboard/UrlInputForm";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAudit } from "@/hooks/useAudit";
import { AnimatePresence, motion } from "framer-motion";
import { ScanSearch, TriangleAlert } from "lucide-react";

export default function DashboardPage() {
  const {
    mode,
    url,
    text,
    file,
    loading,
    error,
    result,
    sourceLabel,
    setMode,
    setUrl,
    setText,
    setFile,
    loadSampleCase,
    runAudit,
    reset
  } = useAudit();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Greenwashing Audit Dashboard</h1>
            <p className="mt-1 text-slate-400">
              Submit a URL, PDF report, or marketing copy to run a full compliance audit.
            </p>
          </div>
          <SampleCaseButton onClick={loadSampleCase} disabled={loading} />
        </div>

        <AnimatePresence mode="wait">
          {!result && !loading && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel flex flex-col gap-6 p-6 sm:p-8"
            >
              <InputTabs activeMode={mode} onChange={setMode} />

              {mode === "url" && <UrlInputForm url={url} onChange={setUrl} disabled={loading} />}
              {mode === "pdf" && <PdfDropzone file={file} onChange={setFile} disabled={loading} />}
              {mode === "text" && <TextPasteBox text={text} onChange={setText} disabled={loading} />}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-risk-critical/30 bg-risk-critical/10 p-4 text-sm text-red-300">
                  <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                size="lg"
                icon={<ScanSearch className="h-5 w-5" />}
                onClick={() => runAudit()}
                loading={loading}
                fullWidth
              >
                Run Greenwashing Audit
              </Button>
            </motion.div>
          )}

          {loading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="glass-panel">
                <Spinner />
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResultsView result={result} sourceLabel={sourceLabel} onReset={reset} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
