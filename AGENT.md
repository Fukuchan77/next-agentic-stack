# AGENT.md

This file provides guidance to AI coding agents when working with code in this repository.

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

Direct pnpm equivalents (when mise is unavailable):

- `pnpm exec vitest run` — run unit tests once
- `pnpm exec vitest run tests/App.spec.tsx` — run a single test file
- `pnpm exec biome check .` — lint check
- `pnpm exec tsc --noEmit` — type check

## Architecture

### Tech stack

- **Vite 8** (Rolldown) + **React 19.2** + **TypeScript 6.0**
- **Biome 2.5** — unified linting and formatting (replaces ESLint + StyleLint)
- **Vitest 4** — unit testing (config embedded in [vite.config.ts](vite.config.ts))
- **Playwright** — E2E testing ([playwright.config.ts](playwright.config.ts))
- **pnpm** — package management; **mise** — task management and Node version (LTS)
- **CSS Modules + Sass** — scoped component styles (`.module.scss`)
- **Carbon Design System** (`@carbon/react`) — IBM Carbon UI component library

### Directory structure

```text
src/
  sections/{domain}/
    ComponentName.tsx           # Presentational component
    ComponentName.module.scss   # Scoped CSS module
    useFeatureName.ts           # Custom hook (data/business logic)
tests/
  App.spec.tsx                  # Vitest unit tests
  setupTests.ts                 # Vitest global setup (@testing-library/jest-dom)
  e2e/
    home.spec.ts                # Playwright E2E tests
```

## Non-Obvious Patterns

- **Vitest globals enabled** — Test files can use `test`, `expect` without imports (configured in tsconfig.json)
- **Type imports** — Use `import type` for type-only imports (enforced by Biome's `useImportType` rule)
- **Carbon Sass warnings** — vite.config.ts silences Carbon's deprecated Sass API warnings (`color-functions`, `global-builtin`, `import`)
- **CSS Modules naming** — Dev: `[name]__[local]__[hash:base64:5]`, Prod: `[hash:base64:5]` (configured in vite.config.ts)
