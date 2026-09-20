import { normalizeWhitespace } from "../utils";

export class PdfParseError extends Error {}

export interface PdfParseResult {
  text: string;
  numPages: number;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  if (buffer.length === 0) {
    throw new PdfParseError("The uploaded PDF file is empty.");
  }

  if (buffer.length > 25 * 1024 * 1024) {
    throw new PdfParseError("PDF files larger than 25MB are not supported.");
  }

  const header = buffer.subarray(0, 5).toString("utf8");
  if (header !== "%PDF-") {
    throw new PdfParseError("The uploaded file does not appear to be a valid PDF.");
  }

  // pdf-parse ships a debug entry point guarded by module.parent checks that only
  // triggers when run as a CLI, so it is safe to require lazily at request time here.
  const pdfParseModule = (await import("pdf-parse")).default as (
    dataBuffer: Buffer
  ) => Promise<{ text: string; numpages: number }>;

  let parsed: { text: string; numpages: number };
  try {
    parsed = await pdfParseModule(buffer);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown parsing error";
    throw new PdfParseError(`Failed to parse PDF: ${reason}`);
  }

  const text = normalizeWhitespace(parsed.text ?? "");

  if (text.length < 40) {
    throw new PdfParseError(
      "Could not extract readable text from this PDF. It may be a scanned image without an OCR text layer."
    );
  }

  return {
    text: text.slice(0, 30000),
    numPages: parsed.numpages ?? 0
  };
}
