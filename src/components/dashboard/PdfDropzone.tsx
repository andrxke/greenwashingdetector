"use client";

import { cx } from "@/lib/utils";
import { FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface PdfDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

export function PdfDropzone({ file, onChange, disabled }: PdfDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const candidate = fileList[0];
      if (candidate.type !== "application/pdf" && !candidate.name.toLowerCase().endsWith(".pdf")) {
        return;
      }
      onChange(candidate);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-300">Upload corporate ESG report or brochure (.pdf)</span>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) handleFiles(event.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        className={cx(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragging ? "border-accent bg-accent/5" : "border-white/15 bg-base-900/50 hover:border-white/25",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-lg bg-base-800 px-4 py-2.5">
            <FileText className="h-5 w-5 text-accent" />
            <span className="max-w-[240px] truncate text-sm text-slate-200">{file.name}</span>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded-full p-1 text-slate-500 hover:bg-white/10 hover:text-white"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 border border-accent/30">
              <Upload className="h-6 w-6 text-accent" />
            </span>
            <div>
              <p className="font-medium text-slate-200">Drag &amp; drop your PDF here</p>
              <p className="mt-1 text-sm text-slate-500">or click to browse (max 25MB)</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
