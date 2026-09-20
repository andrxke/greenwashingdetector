"use client";

import { SAMPLE_CASE_LABEL, SAMPLE_CASE_TEXT } from "@/lib/services/sampleCase";
import type { AuditApiError, AuditResult, InputMode } from "@/lib/types";
import { useCallback, useState } from "react";

interface UseAuditState {
  mode: InputMode;
  url: string;
  text: string;
  file: File | null;
  loading: boolean;
  error: string | null;
  result: AuditResult | null;
  sourceLabel: string | null;
}

const INITIAL_STATE: UseAuditState = {
  mode: "text",
  url: "",
  text: "",
  file: null,
  loading: false,
  error: null,
  result: null,
  sourceLabel: null
};

export function useAudit() {
  const [state, setState] = useState<UseAuditState>(INITIAL_STATE);

  const setMode = useCallback((mode: InputMode) => {
    setState((prev) => ({ ...prev, mode, error: null }));
  }, []);

  const setUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, url, error: null }));
  }, []);

  const setText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, text, error: null }));
  }, []);

  const setFile = useCallback((file: File | null) => {
    setState((prev) => ({ ...prev, file, error: null }));
  }, []);

  const loadSampleCase = useCallback(() => {
    setState((prev) => ({
      ...prev,
      mode: "text",
      text: SAMPLE_CASE_TEXT,
      error: null,
      result: null
    }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const runAudit = useCallback(async () => {
    const formData = new FormData();
    formData.set("mode", state.mode);

    let validationError: string | null = null;
    let sourceLabel = "";

    if (state.mode === "url") {
      if (!state.url.trim()) {
        validationError = "Please enter a URL to analyze.";
      } else {
        formData.set("url", state.url.trim());
        sourceLabel = state.url.trim();
      }
    } else if (state.mode === "pdf") {
      if (!state.file) {
        validationError = "Please select a PDF file to upload.";
      } else {
        formData.set("file", state.file);
        sourceLabel = state.file.name;
      }
    } else {
      if (!state.text.trim()) {
        validationError = "Please paste some text to analyze.";
      } else {
        formData.set("text", state.text.trim());
        sourceLabel = state.text.trim() === SAMPLE_CASE_TEXT ? SAMPLE_CASE_LABEL : "Pasted text";
      }
    }

    if (validationError) {
      setState((prev) => ({ ...prev, error: validationError }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, result: null, sourceLabel }));
    await submitAudit(formData, sourceLabel, setState);
  }, [state.mode, state.url, state.file, state.text]);

  return {
    ...state,
    setMode,
    setUrl,
    setText,
    setFile,
    loadSampleCase,
    runAudit,
    reset
  };
}

async function submitAudit(
  formData: FormData,
  sourceLabel: string,
  setState: React.Dispatch<React.SetStateAction<UseAuditState>>
) {
  try {
    const response = await fetch("/api/audit", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as AuditApiError | null;
      const message = errorBody?.error ?? `Request failed with status ${response.status}.`;
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return;
    }

    const result = (await response.json()) as AuditResult;
    setState((prev) => ({ ...prev, loading: false, result, sourceLabel, error: null }));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error while running the audit.";
    setState((prev) => ({ ...prev, loading: false, error: message }));
  }
}
