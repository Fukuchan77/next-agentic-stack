# Technology

この文書は、将来の実装判断を導く技術選択と規約を記録する。正確な依存バージョンの正本は
`package.json`、ランタイムとタスクの正本は `mise.toml` とする。

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript strict | ネイティブコンパイラ系の次期版を先行検証する |
| Runtime | Node.js + pnpm | mise で固定し、単一パッケージとして運用する |
| Framework | Next.js App Router + React | Server Components を既定、Turbopack を標準ビルド経路とする |
| AI | Vercel AI SDK `ToolLoopAgent` | Anthropic、OpenAI、Ollama を provider registry で解決する |
| Validation | Zod | 環境変数、リクエスト、ツール入力などサーバー境界で使用する |
| UI | shadcn/ui + Tailwind CSS | new-york スタイル、CSS variables、RSC 対応を標準とする |
| Data store | なし | サンプルは永続化を持たず、rate limit はプロセス内メモリである |
| Testing | Vitest + Testing Library + Playwright | 単体は jsdom、route は node、E2E は複数ブラウザで実行する |
| Quality | Biome + TypeScript + size-limit | lint、format、型、テスト、ビルド、バンドル予算を自動検査する |
| Tooling | mise + pnpm | コマンドは `mise run <task>` を優先する |

## Key Decisions

- **Server Components が既定** — データ取得と環境依存の解決をサーバーに置き、`"use client"` は
  ブラウザ状態または対話性が必要な末端に限定する。
- **境界で strict に検証** — `/api/chat` は rate limit、body size、strict request schema の順で
  モデル呼び出し前に拒否し、環境変数とツール入力も Zod で検証する。
- **クライアント共有定義は Zod 非依存** — provider の ID や label は plain TypeScript で共有し、
  サーバー側が必要な schema を組み立てる。
- **AI SDK のサーバー実装を隔離** — env、registry、agent はサーバー専用とし、クライアントは
  UI message の型だけを `import type` で参照する。
- **時刻を依存注入する** — ツールと rate limiter は `Clock` を受け取り、テストでは固定時刻を渡す。
- **モデル ID を一か所に集約する** — 許可リストと既定値は
  `src/lib/ai/model-allowlist.ts` を正本にする。
- **テストで実 LLM を呼ばない** — 単体は `ai/test`、E2E は `page.route` の UI Message Stream で
  ネットワーク境界を置き換える。
- **プレリリース版は exact pin** — TypeScript nightly、Next.js canary、Playwright alpha は固定し、
  公開後 24 時間以上経過した版だけを候補にする。
- **バンドルを予算管理する** — Client JS 240 kB、Client CSS 6 kB（brotli）を上限とし、
  UI 変更時は `size-limit` で確認する。

## Conventions

- **Typing**: `strict` を維持し、外部値は `unknown` から検証する。型だけの依存は
  `import type` を使い、公開境界で根拠のない `any` や型アサーションを避ける。
- **Errors**: API 境界は原因に対応する HTTP status を返し、モデルを呼ぶ前に失敗させる。
  UI は利用者向けの安定したメッセージを表示し、詳細はサーバーログに残す。
- **Limits**: 件数、文字数、本文 bytes、rate、エージェント step には定数または検証 schema で
  明示的な上限を設ける。クライアントの `maxLength` とサーバー制限は同じ zod-free 定数を共有する。
- **Testing**: `tests/*.spec.ts(x)` に振る舞い単位で置く。Route handler は node environment、
  UI は Testing Library、ユーザーフローは `tests/e2e/` で検証する。
- **Formatting**: Biome を正本とし、tab indentation、double quotes、100 文字幅に従う。
- **Commands**: `mise run <task>` を優先し、定義がない場合だけ `pnpm exec <cmd>` を使う。
- **Gate command**: 現在は単一の `gate` タスクがない。最低限 `mise run lint`、
  `mise run typecheck`、`mise run test:run`、`mise run build` を実行し、変更内容に応じて
  `mise run test:e2e` と `mise run size` を追加する。
- **Preflight command**: 依存変更またはベータ検証の開始時は `mise run outdated`。

## Constraints

- Next.js の実装前に、インストール済み `node_modules/next/dist/docs/` の該当ガイドを確認する。
- App Router の route file は HTTP method など許可された export だけにし、テスト可能な factory は
  `src/lib/` 側へ置く。
- shadcn/ui のコピー済みソースはプロジェクト所有として編集できる。単純な dropdown は
  accessibility と Playwright 操作性のため native select を優先する。
- Tailwind の scan 対象は `src/` に限定し、テーマ token は `src/app/globals.css` で管理する。
- install/postinstall script は既定で遮断し、監査したものだけ `allowBuilds` へ明示する。
- シークレット検査は Git 履歴を対象とする `gitleaks git` を使い、生成物を走査する
  `gitleaks dir` は使わない。
- process-local rate limiter はサンプル用途であり、複数 instance 間の厳密な制限を保証しない。
