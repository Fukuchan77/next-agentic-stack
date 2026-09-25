# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

Tasks are managed via **mise**. Always check [mise.toml](mise.toml) for available tasks.

| Action             | Command              |
| ------------------ | -------------------- |
| Dev server         | `mise run dev`       |
| Build              | `mise run build`     |
| Unit tests (watch) | `mise run test`      |
| Unit tests (once)  | `mise run test:run`  |
| E2E tests          | `mise run test:e2e`  |
| Lint check         | `mise run lint`      |
| Lint + format fix  | `mise run lint:fix`  |
| Type check         | `mise run typecheck` |
| Bundle size        | `mise run size`      |
| Dependency updates | `mise run outdated`  |
| Secret scan        | `mise run secret-scan` / `secret-scan:staged` |

Direct pnpm equivalents (when mise is unavailable):

- `pnpm exec vitest run` — run unit tests once
- `pnpm exec vitest run tests/Chat.spec.tsx` — run a single test file
- `pnpm exec biome check .` — lint check
- `pnpm typecheck` — `next typegen` + `tsc --noEmit` for `src` and `tests`

## Architecture

### Tech stack

- **Node.js 26.10** + **pnpm 12.6** (pinned in `mise.toml` and `package.json`)
- **Next.js 16.4 canary** (App Router, Turbopack is the default bundler) + **React 19.3**
- **TypeScript 7.1 nightly** — the Go-native compiler; `tsc` is fast, and there is no JS compiler API
- **Vercel AI SDK 7** — `ToolLoopAgent`, `createAgentUIStreamResponse`, `useChat` (`@ai-sdk/react`)
- **Providers** — Anthropic (`@ai-sdk/anthropic`), OpenAI (`@ai-sdk/openai`), Ollama (`@ai-sdk/openai-compatible`)
- **Zod 4.6** — validation for env vars, request bodies and tool inputs
- **Biome 2.5** — linting and formatting (with the `next`, `react` and `test` domains)
- **Vitest 5** — unit testing ([vitest.config.ts](vitest.config.ts), jsdom)
- **Playwright 1.64 alpha** — E2E testing ([playwright.config.ts](playwright.config.ts))
- **CSS Modules** — scoped component styles (`.module.css`); theme tokens in `src/app/globals.css`

### Directory structure

```text
src/
  app/                          # App Router (layout, page, api/chat/route.ts)
  lib/                          # clock / rate-limit
  lib/ai/                       # providers / env / registry / agent / tools / chat-handler / chat-request / limits
  sections/{domain}/
    ComponentName.tsx           # Component (Server by default; "use client" only when needed)
    ComponentName.module.css    # Scoped CSS module
    getFeatureName.ts           # Data access called from Server Components
tests/
  *.spec.ts(x)                  # Vitest unit tests
  helpers/mockModel.ts          # MockLanguageModelV4 factories (ai/test)
  e2e/*.spec.ts                 # Playwright E2E tests
```

## Non-Obvious Patterns

- **Check for updates before starting work** — this repo exists to try the newest releases, so run `mise run outdated` at the start of a task. `pnpm outdated` does not report newer builds of the exact-pinned prereleases; `scripts/check-updates.mjs` does (respecting `minimumReleaseAge`). Apply updates in their own commit and re-run typecheck / tests / build.
- **`/api/chat` is guarded before the model is called** — `src/lib/ai/chat-handler.ts` runs rate limit (`429`) → body size (`413`) → `z.strictObject` request schema (`400`). The route file only does `export const POST = createChatHandler()` because App Router route files may export nothing but HTTP methods; tests call `createChatHandler({ now, rateLimiter })` for a fresh limiter per test. Input limits live in `src/lib/ai/limits.ts` (zod-free, shared with the client's `maxLength`). The rate limiter is in-process memory — per instance, not global.
- **Inject time, never call `new Date()` in tools** — tools and the rate limiter take a `Clock` (`src/lib/clock.ts`); `createChatAgent(model, { now })` threads it into `createGetCurrentTimeTool(now)`. Tests pass a fixed clock.
- **Secret scanning is `gitleaks git`, never `gitleaks dir`** — `dir` would walk `node_modules/` and `.next/`. The CI job needs `fetch-depth: 0` or it scans a single commit.

- **AI SDK v7 naming** — `system` → `instructions`, `stepCountIs` → `isStepCount`, `onFinish` → `onEnd`, `fullStream` → `stream`. Check `node_modules/ai/docs` (shipped with the package) before relying on memory of older versions.
- **Keep zod out of client code** — `src/lib/ai/providers.ts` is imported by the client `Chat` component, so it must stay zod-free. Put Zod schemas in server modules (`env.ts`, `route.ts`, `tools.ts`).
- **Server-only modules** — `env.ts`, `registry.ts`, `agent.ts` must never be imported (as values) from `"use client"` files. `import type { ChatAgentUIMessage }` is fine.
- **Tool part names** — a tool registered as `getCurrentTime` arrives in the UI as `part.type === "tool-getCurrentTime"`.
- **Path alias** — `@/*` → `src/*` (tsconfig `paths`; mirrored in `vitest.config.ts`).
- **Vitest globals enabled** — tests use `test`, `expect`, `vi` without imports (typed via `tests/tsconfig.json`). Route handler tests use `// @vitest-environment node`.
- **`next-env.d.ts` is generated** — it is gitignored; `pnpm typecheck` runs `next typegen` first so `tsc` works on a fresh clone.
- **Playwright webServer runs `next` directly** — under pnpm 12, `pnpm start`/`pnpm exec` do not forward the shutdown signal to `next-server`, which hangs Playwright after the run. Always launch E2E via `pnpm test:e2e` / `pnpm exec playwright test` so `node_modules/.bin` is on `PATH`.
- **E2E never calls a real LLM** — `/api/chat` is mocked with `page.route` returning a UI Message Stream (SSE).
- **Prerelease pins** — `typescript`, `next`, `@playwright/test` are pinned to exact prerelease builds that are at least 24 h old (to satisfy `minimumReleaseAge`). Do not switch them to ranges.
- **Dependabot** — weekly npm + GitHub Actions PRs with `cooldown: 1 day` (mirrors `minimumReleaseAge`). `ai`/`@ai-sdk/*` are grouped because they share `@ai-sdk/provider-utils`; `next`/`typescript` prerelease pins are grouped into one PR. `@playwright/test` is ignored — Dependabot ranks timestamp-style alphas (`1.64.0-alpha-1789764292000`) above date-style ones and opens downgrade PRs, so check it with `mise run outdated` (compares publish time). Remove the ignore once it moves to a stable caret range.
- **Build scripts** — pnpm 12 uses `allowBuilds` (not `onlyBuiltDependencies`/`ignoredBuiltDependencies`) in `pnpm-workspace.yaml`.
