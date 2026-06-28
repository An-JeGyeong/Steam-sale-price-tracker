<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Steam Price Checker — Agent Team

## Project Overview

Next.js 16 / React 19 app that queries the IsThereAnyDeal (ITAD) API to tell users whether a current Steam sale is an all-time low. API key lives in `.env.local` as `ITAD_API_KEY`.

---

## Agent Roles

### 1. Frontend Agent

**Owns:** `app/page.tsx`, `app/layout.tsx`, `app/globals.css`

**Responsibilities:**
- UI/UX: search input, candidate list, price result card
- Loading / error states
- Dark mode, accessibility (a11y), keyboard navigation
- Display game box art (`assets.boxart`) when available
- Korean locale formatting (prices, copy)

**Conventions:**
- Tailwind v4 utility classes only — no CSS-in-JS
- `"use client"` only when strictly needed
- Fetch via `/api/*` routes; never call ITAD directly from the browser

---

### 2. Backend Agent

**Owns:** `lib/itad.ts`, `app/api/search/route.ts`, `app/api/check/route.ts`

**Responsibilities:**
- ITAD API integration (search, prices v3)
- Input validation and error responses
- Leverage Next.js `fetch` cache/revalidation to avoid redundant API calls
- Keep `ITAD_API_KEY` server-side only — never leak to the client
- Country code: default `US`; accept optional `country` query param

**Conventions:**
- Route handlers return `NextResponse.json(payload, { status })` — no raw `Response`
- Throw typed errors; route handler catches and serialises
- Avoid any `console.log` in production paths

---

### 3. Code Review Agent

**Owns:** whole repo (read-only analysis)

**Responsibilities:**
- Security: API key exposure, injection, SSRF risks
- Type safety: missing `as`, unsafe casts, unchecked API responses
- Performance: unnecessary re-renders, missing Suspense boundaries, unoptimised fetches
- Correctness: `isAllTimeLow` flag logic (`"H"` | `"N"` from ITAD), edge cases
- Produce a ranked findings list with file:line references and suggested fixes

**Conventions:**
- Report findings as Markdown; group by severity (Critical / High / Medium / Low)
- Do not make code changes — findings go to the team for action

---

## Shared Conventions

- TypeScript strict mode — no `any`, no `@ts-ignore`
- All user-facing strings in Korean
- No `console.log` in committed code
- Commit messages: imperative English, one line, ≤72 chars
