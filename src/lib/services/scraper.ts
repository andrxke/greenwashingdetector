import * as cheerio from "cheerio";
import { normalizeWhitespace } from "../utils";

const SUSTAINABILITY_KEYWORDS = [
  "sustainab",
  "carbon",
  "emission",
  "eco-friendly",
  "eco friendly",
  "net zero",
  "net-zero",
  "green",
  "renewable",
  "climate",
  "environment",
  "esg",
  "biodegradable",
  "recycl",
  "offset",
  "footprint",
  "planet",
  "responsib",
  "ethical",
  "clean energy"
];

const REMOVE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "nav",
  "footer",
  "header",
  "form",
  "button",
  "[aria-hidden='true']"
];

export class ScraperError extends Error {}

export interface ScrapeResult {
  title: string;
  url: string;
  text: string;
}

export async function scrapeUrl(rawUrl: string): Promise<ScrapeResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ScraperError(`"${rawUrl}" is not a valid URL.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScraperError("Only http:// and https:// URLs are supported.");
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EcoClaimAuditor/1.0; +https://hackthenorth.com)",
        Accept: "text/html,application/xhtml+xml"
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000)
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown network error";
    throw new ScraperError(`Failed to fetch the URL: ${reason}`);
  }

  if (!response.ok) {
    throw new ScraperError(`The URL returned HTTP ${response.status} ${response.statusText}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("xml") && contentType !== "") {
    throw new ScraperError(
      `Expected an HTML page but received content-type "${contentType}". Try a different URL.`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  REMOVE_SELECTORS.forEach((selector) => $(selector).remove());

  const title = normalizeWhitespace($("title").first().text() || url.hostname);

  const metaDescription = $('meta[name="description"]').attr("content") ?? "";

  const blocks: string[] = [];
  if (metaDescription) blocks.push(metaDescription);

  $("h1, h2, h3, h4, p, li, blockquote, span, div").each((_, el) => {
    const node = $(el);
    if (node.children().length > 0 && node.text().trim().length > 400) {
      return;
    }
    const text = normalizeWhitespace(node.text());
    if (text.length < 15) return;
    blocks.push(text);
  });

  const deduped = Array.from(new Set(blocks));

  const keywordIndexes = deduped
    .map((block, index) => ({
      index,
      relevant: SUSTAINABILITY_KEYWORDS.some((keyword) => block.toLowerCase().includes(keyword))
    }))
    .filter((entry) => entry.relevant)
    .map((entry) => entry.index);

  const keywordHits = keywordIndexes.length;
  const contextIndexes = new Set<number>();
  keywordIndexes.forEach((index) => {
    for (let offset = -1; offset <= 1; offset += 1) {
      if (index + offset >= 0 && index + offset < deduped.length) {
        contextIndexes.add(index + offset);
      }
    }
  });

  const prioritized =
    keywordHits >= 3 ? deduped.filter((_, index) => contextIndexes.has(index)) : deduped;

  const combinedText = prioritized.join("\n\n");

  if (combinedText.trim().length < 40) {
    throw new ScraperError(
      "Could not extract meaningful text content from this page. It may be JavaScript-rendered or blocked scraping."
    );
  }

  return {
    title,
    url: url.toString(),
    text: normalizeWhitespace(combinedText).slice(0, 20000)
  };
}
