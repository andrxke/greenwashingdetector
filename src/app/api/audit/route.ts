import { NextResponse } from "next/server";
import { generateAudit } from "@/lib/services/aiClient";
import { PdfParseError, parsePdfBuffer } from "@/lib/services/pdfParser";
import { ScraperError, scrapeUrl } from "@/lib/services/scraper";
import type { AuditApiError, AuditResult, InputMode } from "@/lib/types";
import { isLikelyUrl, normalizeWhitespace } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 30000;
const MIN_TEXT_LENGTH = 20;

function errorResponse(message: string, status: number, detail?: string) {
  const body: AuditApiError = { error: message, detail };
  return NextResponse.json(body, { status });
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Request must be sent as multipart/form-data.", 400);
  }

  const mode = formData.get("mode");
  if (mode !== "url" && mode !== "pdf" && mode !== "text") {
    return errorResponse('Field "mode" must be one of "url", "pdf", or "text".', 400);
  }

  const inputMode = mode as InputMode;

  let content = "";
  let sourceLabel = "";

  try {
    if (inputMode === "url") {
      const urlValue = formData.get("url");
      if (typeof urlValue !== "string" || !urlValue.trim()) {
        return errorResponse("Please provide a URL to analyze.", 400);
      }
      if (!isLikelyUrl(urlValue.trim())) {
        return errorResponse("Please provide a valid http:// or https:// URL.", 400);
      }

      const scraped = await scrapeUrl(urlValue.trim());
      content = scraped.text;
      sourceLabel = `Website: ${scraped.title} (${scraped.url})`;
    } else if (inputMode === "pdf") {
      const file = formData.get("file");
      if (!(file instanceof Blob)) {
        return errorResponse("Please upload a PDF file.", 400);
      }
      if (file.type && file.type !== "application/pdf" && !("name" in file && String((file as File).name).toLowerCase().endsWith(".pdf"))) {
        return errorResponse("Only PDF files are supported.", 400);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await parsePdfBuffer(buffer);
      content = parsed.text;
      const fileName = file instanceof File ? file.name : "uploaded-report.pdf";
      sourceLabel = `PDF report: ${fileName} (${parsed.numPages} page${parsed.numPages === 1 ? "" : "s"})`;
    } else {
      const textValue = formData.get("text");
      if (typeof textValue !== "string" || !textValue.trim()) {
        return errorResponse("Please provide some text to analyze.", 400);
      }
      content = normalizeWhitespace(textValue);
      sourceLabel = "Pasted marketing copy / social statement";
    }
  } catch (err) {
    if (err instanceof ScraperError || err instanceof PdfParseError) {
      return errorResponse(err.message, 422);
    }
    console.error("[api/audit] Unexpected ingestion error:", err);
    return errorResponse("An unexpected error occurred while processing the input.", 500);
  }

  content = content.trim();

  if (content.length < MIN_TEXT_LENGTH) {
    return errorResponse(
      "Not enough text content was found to run a meaningful audit. Please provide more detailed content.",
      422
    );
  }

  if (content.length > MAX_TEXT_LENGTH) {
    content = content.slice(0, MAX_TEXT_LENGTH);
  }

  try {
    const result: AuditResult = await generateAudit(sourceLabel, content);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[api/audit] Analysis engine failure:", err);
    return errorResponse("The audit engine failed to produce a result. Please try again.", 500);
  }
}
