# EcoClaim Auditor

AI-powered greenwashing detection platform built for Hack the North 2026. EcoClaim Auditor analyzes corporate websites, uploaded ESG PDF reports, or pasted marketing copy, flags deceptive or unsubstantiated environmental claims, computes a quantitative **Greenwashing Risk Score**, and produces a structured audit report with actionable, compliant corrections.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then click **Launch the Auditor** (or go directly to `/app`).

The app works **fully out of the box with zero configuration** — no API keys required.

## How It Works

1. **Input** — submit a URL, upload a PDF ESG report, or paste raw text via the `/app` dashboard.
2. **Ingestion** — the `/api/audit` route handler scrapes the URL (`cheerio`) or extracts PDF text (`pdf-parse`).
3. **Analysis** — the extracted content is sent to `generateAudit()`:
   - If `AI_ENDPOINT_URL` / `AI_API_KEY` / `AI_MODEL` are configured in the deployment environment, it calls that OpenAI-compatible chat-completions endpoint (Baseten, Modal, or OpenAI) using an evidence-grounded screening prompt and validates the JSON response with `zod`.
   - Otherwise (or if the LLM call/validation fails), it automatically falls back to a deterministic **heuristic auditor** that performs real pattern-based greenwashing detection — no external dependency required.
4. **Results** — an animated screening-risk gauge, claim-by-claim breakdown (original quote / critique / evidence status / regulation tip), missing-metrics checklist, and a suggested revision requiring human review are rendered, with a one-click PDF export.

The report is a screening aid, not a legal determination. Each finding carries an evidence status (`supported`, `contradicted`, or `insufficient_evidence`) and a screening confidence. Claims are accepted only when their quoted text appears in the submitted source, and risk level is derived from the numeric score on the server.

## Enabling Real LLM Analysis

Configure these variables in `.env.local` for local development or in your deployment environment:

```bash
AI_ENDPOINT_URL=https://your-endpoint/v1/chat/completions
AI_API_KEY=your-api-key
AI_MODEL=your-model-name
```

Both Baseten and Modal deployments commonly expose OpenAI-compatible chat-completions endpoints in this shape.

For dependable results, choose a provider/model that supports JSON mode (or structured outputs), use the exact model slug from the provider's current catalog, and benchmark it against labeled cases covering negations, comparative claims, missing evidence, contradictory documents, and prompt-injection text. The request intentionally avoids provider-specific reasoning parameters; add those only after confirming that the selected model supports them. A provider failure, truncated completion, malformed JSON response, or source-inconsistent quote falls back to the deterministic screening engine.

## Project Structure

- `src/app` — Next.js App Router pages and the `/api/audit` route handler.
- `src/lib/services` — scraper, PDF parser, prompt/schema contract, heuristic auditor, and AI client.
- `src/components/dashboard` — multi-input dashboard UI (URL / PDF / text / sample case).
- `src/components/results` — animated risk gauge, claim cards, missing metrics, remediated copy, PDF export.
- `src/hooks/useAudit.ts` — client-side state machine driving the dashboard.

## Scripts

- `npm run dev` — start the development server.
- `npm run build` — production build.
- `npm run start` — run the production build.
- `npm run lint` — run ESLint.
