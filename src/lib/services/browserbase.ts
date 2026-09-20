import Browserbase from "@browserbasehq/sdk";
import { chromium } from "playwright-core";
import * as cheerio from "cheerio";
import { normalizeWhitespace } from "../utils";
import type { ScrapeResult } from "./scraper";

const MAX_DISCOVERED_SOURCES = 4;
const MAX_SOURCE_TEXT = 12000;
const REPORT_TERMS = /(sustainab|esg|climate|carbon|environment|impact|responsib|annual report)/i;
const REPORT_LINK_TERMS = /(sustainab|esg|climate|carbon|environment|impact|responsib|report|pdf)/i;

export class BrowserbaseError extends Error {}

export interface AcquiredSource extends ScrapeResult {
  acquisition: "direct" | "browserbase-fetch" | "browserbase-browser" | "browserbase-search";
}

function getClient(): Browserbase | null {
  const apiKey = process.env.BROWSERBASE_API_KEY;
  if (!apiKey) return null;
  return new Browserbase({
    apiKey,
    ...(process.env.BROWSERBASE_BASE_URL ? { baseURL: process.env.BROWSERBASE_BASE_URL } : {}),
    timeout: 20000,
    maxRetries: 1
  });
}

export function isBrowserbaseConfigured() {
  return Boolean(process.env.BROWSERBASE_API_KEY);
}

function safeUrl(rawUrl: string): URL | null {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function extractHtml(html: string, url: string, acquisition: AcquiredSource["acquisition"]): AcquiredSource {
  const parsedUrl = safeUrl(url);
  if (!parsedUrl) throw new BrowserbaseError("Browserbase returned an unsafe URL.");
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, nav, footer, header, form, button").remove();
  const title = normalizeWhitespace($("title").first().text() || parsedUrl.hostname);
  const blocks: string[] = [];
  $("meta[name='description'], h1, h2, h3, h4, p, li, blockquote, span, div").each((_, element) => {
    const text = normalizeWhitespace($(element).attr("content") || $(element).text());
    if (text.length >= 15 && text.length <= 1200) blocks.push(text);
  });
  const text = (Array.from(new Set(blocks)).join("\n\n") || normalizeWhitespace($.root().text())).slice(0, MAX_SOURCE_TEXT);
  if (text.length < 40) throw new BrowserbaseError("Browserbase could not extract meaningful page text.");
  return { title, url: parsedUrl.toString(), text, acquisition };
}
function reportLinks(html: string, baseUrl: URL): string[] {
  const $ = cheerio.load(html);
  return Array.from(
    new Set(
      $("a[href]")
        .map((_, element) => {
          const href = $(element).attr("href");
          if (!href) return null;
          try {
            const link = new URL(href, baseUrl);
            return (link.protocol === "http:" || link.protocol === "https:") &&
              link.hostname === baseUrl.hostname &&
              REPORT_LINK_TERMS.test(`${link.pathname} ${$(element).text()}`)
              ? link.toString()
              : null;
          } catch {
            return null;
          }
        })
        .get()
        .filter((link): link is string => Boolean(link))
    )
  ).slice(0, 2);
}

async function fetchPage(client: Browserbase, url: string): Promise<AcquiredSource> {
  const response = await client.fetchAPI.create({ url, allowRedirects: true, format: "raw" });
  if (response.statusCode < 200 || response.statusCode >= 400 || typeof response.content !== "string") {
    throw new BrowserbaseError(`Browserbase Fetch returned HTTP ${response.statusCode}.`);
  }
  return extractHtml(response.content, url, "browserbase-fetch");
}

async function browsePage(client: Browserbase, url: string): Promise<AcquiredSource> {
  const parsedUrl = safeUrl(url);
  if (!parsedUrl) throw new BrowserbaseError("Only http:// and https:// URLs are supported.");
  const session = await client.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID || undefined,
    api_timeout: 45,
    browserSettings: {
      allowedDomains: [parsedUrl.hostname],
      recordSession: false,
      logSession: false
    }
  });
  let browser;
  try {
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto(parsedUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => undefined);
    const landingHtml = await page.content();
    const landing = extractHtml(landingHtml, page.url(), "browserbase-browser");
    for (const reportUrl of reportLinks(landingHtml, parsedUrl)) {
      try {
        await page.goto(reportUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
        const report = extractHtml(await page.content(), page.url(), "browserbase-browser");
        if (report.text.length > landing.text.length) return report;
      } catch {
        // Keep the landing page if an individual report link is unavailable.
      }
    }
    return landing;
  } finally {
    await browser?.close().catch(() => undefined);
    await client.sessions.update(session.id, { status: "REQUEST_RELEASE" }).catch(() => undefined);
  }
}

export async function acquireUrlSource(url: string): Promise<AcquiredSource> {
  const client = getClient();
  if (!client) throw new BrowserbaseError("Browserbase is not configured.");
  try {
    const fetched = await fetchPage(client, url);
    if (fetched.text.length >= 200) return fetched;
  } catch {
    // Fall through to a browser for JavaScript-heavy or blocked pages.
  }
  return browsePage(client, url);
}

export async function discoverCompanySources(company: string): Promise<AcquiredSource[]> {
  const client = getClient();
  if (!client) throw new BrowserbaseError("Company discovery requires BROWSERBASE_API_KEY.");
  const search = await client.search.web({
    query: `${company.trim()} sustainability ESG climate report`,
    numResults: 10
  });
  const candidates = search.results
    .filter((result) => safeUrl(result.url) && (REPORT_TERMS.test(result.title) || REPORT_TERMS.test(result.url)))
    .filter((result) => !/(wikipedia|linkedin|facebook|youtube|medium\.com|glassdoor)/i.test(result.url))
    .sort((a, b) => {
      const score = (result: { title: string; url: string }) =>
        (REPORT_LINK_TERMS.test(result.title) ? 2 : 0) + (REPORT_LINK_TERMS.test(result.url) ? 1 : 0);
      return score(b) - score(a);
    })
    .slice(0, MAX_DISCOVERED_SOURCES);
  const sources: AcquiredSource[] = [];
  for (const candidate of candidates) {
    try {
      sources.push(await fetchPage(client, candidate.url));
    } catch {
      try {
        sources.push(await browsePage(client, candidate.url));
      } catch {
        // Continue when an individual result is unavailable.
      }
    }
  }
  if (!sources.length) throw new BrowserbaseError(`No readable sustainability reports were found for "${company}".`);
  return sources;
}

export async function enrichUrlSource(url: string, direct?: ScrapeResult): Promise<AcquiredSource> {
  if (direct && direct.text.length >= 200) return { ...direct, acquisition: "direct" };
  return acquireUrlSource(url);
}
