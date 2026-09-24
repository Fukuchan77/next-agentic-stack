<h1 align="center">🤖 Next Agentic Stack</h1>

<p align="center">
  Next.js App Router + Vercel AI SDK で AI エージェントアプリを作り始めるためのテンプレート。<br/>
  単体テスト・E2E テスト・CI・Lint/Format・バンドルサイズ監視・サプライチェーン対策を同梱。
</p>

## 🌈 技術スタック

| 領域 | 採用技術 | バージョン |
| --- | --- | --- |
| ランタイム | [Node.js](https://nodejs.org) | 26.10 |
| 言語 | [TypeScript](https://www.typescriptlang.org)(Go 製ネイティブコンパイラ) | 7.1(nightly) |
| パッケージ管理 | [pnpm](https://pnpm.io) | 12.6 |
| フレームワーク | [Next.js](https://nextjs.org)(App Router + Turbopack) | 16.4(canary) |
| UI | [React](https://react.dev) | 19.3 |
| AI | [Vercel AI SDK](https://ai-sdk.dev)(Anthropic / OpenAI / Ollama) | 7.0 |
| バリデーション | [Zod](https://zod.dev) | 4.6 |
| Lint / Format | [Biome](https://biomejs.dev) | 2.5 |
| 単体テスト | [Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) | 5.0 |
| E2E テスト | [Playwright](https://playwright.dev)(Chromium / Firefox) | 1.64(alpha) |
| スタイル | CSS Modules | — |
| ツール/タスク管理 | [mise](https://mise.jdx.dev)(Node / pnpm バージョン + タスクランナー) | — |
| バンドルサイズ監視 | [size-limit](https://github.com/ai/size-limit) | 14 |
| シークレットスキャン | [gitleaks](https://github.com/gitleaks/gitleaks) | 8.30 |

> [!WARNING]
> TypeScript 7.1 / Next.js 16.4 / Playwright 1.64 は執筆時点(2026-09)で未リリースのため、
> プレリリース版(nightly / canary / alpha)を**特定バージョンに固定**して使用しています。
> 正式版の公開後は `package.json` を安定版に更新してください([更新手順](#-プレリリース版の更新))。

## 🚀 はじめに

前提: [mise](https://mise.jdx.dev) をインストール済みであること(Node と pnpm は mise が `mise.toml` の固定バージョンで用意します)。

```bash
mise install              # Node 26.10.0 / pnpm 12.6.0 を用意
pnpm install              # 依存をインストール
cp .env.example .env.local  # API キー・モデルを設定
mise run dev              # 開発サーバーを http://localhost:3000 で起動
```

### AI プロバイダの設定

`.env.local` で既定のプロバイダとモデルを指定します(画面上のセレクタでリクエストごとに切り替えも可能)。環境変数は起動時に Zod で検証され、不正な値はエラーになります。

| プロバイダ | 必要な環境変数 | 既定モデル |
| --- | --- | --- |
| `anthropic` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL=claude-sonnet-5` |
| `openai` | `OPENAI_API_KEY` | `OPENAI_MODEL=gpt-5.5` |
| `ollama` | なし(ローカルで `ollama serve`) | `OLLAMA_MODEL=qwen3` / `OLLAMA_BASE_URL=http://localhost:11434/v1` |

既定プロバイダは `AI_PROVIDER`(`anthropic` | `openai` | `ollama`、既定 `anthropic`)で指定します。Ollama は公式の OpenAI 互換 API に `@ai-sdk/openai-compatible` で接続します。

### チャット API の入力制限とレート制限

`POST /api/chat` はモデルを呼び出す(= API 料金が発生する)前に、次の順でリクエストを弾きます。

| 検査 | 上限 | 超過時 |
| --- | --- | --- |
| レート制限(クライアント IP ごと・固定ウィンドウ) | `CHAT_RATE_LIMIT_MAX` 回 / `CHAT_RATE_LIMIT_WINDOW_SECONDS` 秒(既定 20 回 / 60 秒) | `429` + `Retry-After` |
| ボディサイズ | 512 KiB | `413` |
| リクエスト形状 | `z.strictObject`(useChat が送る `id` / `messages` / `trigger` / `messageId` / `provider` 以外は拒否)、`system` ロール拒否 | `400` |
| 件数・長さ | メッセージ 50 件、1 メッセージ 32 パート、ユーザーテキスト 8,000 文字 | `400` |

入力上限は [`src/lib/ai/limits.ts`](src/lib/ai/limits.ts) に集約しており、変更はコード変更(レビュー対象)で行います。レート制限はプロセス内メモリで数えるため、複数インスタンス / サーバーレスで厳密に制限する場合は Redis 等の共有ストアに置き換えてください。

このテンプレートをベースに新規プロジェクトを作る場合は、`package.json` の `name` / `author` / `license`、`LICENSE` の著作者、`src/app/layout.tsx` の `metadata`、`src/app/favicon.ico` を更新してください。

## 📜 タスク一覧

タスクは **mise** で管理しています(`mise.toml` が正)。`mise run <task>` または直接 `pnpm <...>` で実行できます。

| 用途 | mise | pnpm |
| --- | --- | --- |
| 開発サーバー(Turbopack) | `mise run dev` | `pnpm dev` |
| 本番ビルド(Turbopack) | `mise run build` | `pnpm build` |
| 本番サーバー | `mise run start` | `pnpm start`(要 build) |
| 単体テスト(watch) | `mise run test` | `pnpm test` |
| 単体テスト(一回) | `mise run test:run` | `pnpm test:run` |
| カバレッジ計測 | `mise run test:coverage` | `pnpm test:coverage` |
| E2E テスト | `mise run test:e2e` | `pnpm test:e2e` |
| Lint/Format チェック | `mise run lint` | `pnpm lint` |
| Lint/Format 自動修正 | `mise run lint:fix` | `pnpm lint:fix` |
| 型チェック | `mise run typecheck` | `pnpm typecheck` |
| バンドルサイズ検査 | `mise run size` | `pnpm size`(要 build) |
| 依存の最新チェック | `mise run outdated` | `pnpm outdated` + `node scripts/check-updates.mjs` |
| シークレットスキャン(全履歴) | `mise run secret-scan` | `gitleaks git --redact .` |
| シークレットスキャン(ステージ済み) | `mise run secret-scan:staged` | `gitleaks git --staged --redact .` |

## 📁 フォルダ構成

機能(ドメイン)単位でコンポーネント・データ取得・スコープド CSS を同居させる **feature-based colocation** を採用しています。

```text
src/
  app/                            # Next.js App Router
    layout.tsx                    # ルートレイアウト(metadata)
    page.tsx                      # トップページ(Server Component)
    globals.css                   # グローバルスタイル(CSS 変数・ダークモード)
    api/chat/route.ts             # チャット API(Route Handler。実体は lib/ai/chat-handler.ts)
  lib/
    clock.ts                      # 現在時刻の注入点(Clock。テストで時刻を固定する)
    rate-limit.ts                 # クライアントごとの固定ウィンドウ・レート制限
  lib/ai/
    chat-handler.ts               # /api/chat の処理(レート制限 → 入力検証 → エージェント)
    chat-request.ts               # リクエストの strict スキーマとサイズ上限付き読み取り
    limits.ts                     # 入力上限(クライアント/サーバー共有。zod 非依存)
    providers.ts                  # プロバイダ ID(クライアント/サーバー共有。zod 非依存)
    env.ts                        # AI 関連環境変数の Zod スキーマ(サーバー専用)
    registry.ts                   # Anthropic / OpenAI / Ollama のプロバイダレジストリ
    agent.ts                      # ToolLoopAgent(ツール呼び出しループ)
    tools.ts                      # エージェントのツール定義(入力は Zod スキーマ)
  sections/{domain}/
    ComponentName.tsx             # 表示用コンポーネント("use client" は必要な場合のみ)
    ComponentName.module.css      # スコープド CSS Module
    getFeatureName.ts             # Server Component から呼ぶデータ取得関数
tests/
  *.spec.ts(x)                    # Vitest 単体テスト
  helpers/mockModel.ts            # AI SDK のモックモデル(ai/test)
  setupTests.ts                   # Vitest グローバルセットアップ
  tsconfig.json                   # テスト用 tsconfig(vitest/globals 型を追加)
  e2e/
    *.spec.ts                     # Playwright E2E テスト(/api/chat はネットワーク層でモック)
```

## ✅ ベストプラクティス指針

- **Server Components がデフォルト**:データ取得は Server Component(`getUsers()` 等)で行い、`"use client"` はインタラクションが必要な末端コンポーネント(`Chat`)に限定する。
- **境界での検証**:外部入力(リクエストボディ・環境変数・ツール入力)は Zod で検証する。リクエストは `z.strictObject` で未知のフィールドを拒否し、件数・長さ・バイト数に上限を設ける。
- **時刻は注入する**:ツールやレート制限は `Clock`(`src/lib/clock.ts`)を引数で受け取り、`new Date()` を直接呼ばない。テストでは固定時刻を渡す。
- **クライアントバンドルに zod を持ち込まない**:クライアントと共有する定義(`providers.ts`)は zod 非依存にし、スキーマはサーバー側で組み立てる。
- **エージェントループの上限**:`ToolLoopAgent` は `stopWhen: isStepCount(5)` で暴走を防ぐ。
- **LLM 呼び出しをテストでモック**:単体テストは `ai/test` の `MockLanguageModelV4`、E2E は `page.route` で UI Message Stream をモックし、API キーなしで CI が回る。
- **型のみの import は `import type`**:Biome の `useImportType` で強制。
- **バンドルサイズのガードレール**:`size-limit` を CI で検査(クライアント JS 240 kB / CSS 4 kB、brotli)。

## 🔒 サプライチェーン対策

`pnpm audit`(既知 CVE 照合)だけでは防げない攻撃を `pnpm-workspace.yaml` で補完しています。

- `minimumReleaseAge: 1440`:公開から 24 時間未満のバージョンを解決しない(プレリリース版も 24 時間以上経過したビルドを選んで固定しており、例外は設けていない)。
- `allowBuilds`:install/postinstall スクリプトはデフォルトでブロックし、許可/拒否を明示。
- Node / pnpm のバージョンを `mise.toml` と `package.json`(`packageManager` / `engines`)で固定。
- CI で `pnpm install --frozen-lockfile` + `pnpm audit --audit-level=moderate`。
- Dependabot(`.github/dependabot.yml`)が npm と GitHub Actions の更新 PR を毎週作成する(`cooldown: 1 日` で `minimumReleaseAge` と整合)。
- CI の `secret-scan` ジョブで gitleaks が全履歴をスキャンする。コミット前には `mise run secret-scan:staged` を推奨。

### 依存の最新チェック

最新機能の検証・試作用のテンプレートのため、作業を始める前など適宜 `mise run outdated` で最新状況を確認してください。範囲指定の依存は `pnpm outdated`、プレリリース固定(nightly / canary / alpha)は [`scripts/check-updates.mjs`](scripts/check-updates.mjs) が npm registry から「公開 24 時間以上経過した最新ビルド」と「正式版の公開有無」を表示します(読み取りのみ。`package.json` は書き換えません)。

詳細な意思決定の記録は [`docs/REFACTORING_PLAN.md`](docs/REFACTORING_PLAN.md) を参照してください。

## 🔁 プレリリース版の更新

TypeScript 7.1 / Next.js 16.4 / Playwright 1.64 の正式版が公開されたら:

1. `package.json` の `typescript` / `next` / `@playwright/test` を正式版に更新(公開から 24 時間経過後)
2. `.github/workflows/tests.yml` の e2e ジョブを公式コンテナイメージ(`mcr.microsoft.com/playwright:v1.64.x-noble`)に戻す
3. `pnpm typecheck && pnpm test:run && pnpm build && pnpm test:e2e` で検証

## 🤝 CI

push のたびに GitHub Actions で以下を実行します。

- **lint**:`biome check` + `pnpm typecheck`(`next typegen` + `tsc`)/ gitleaks(secret-scan)
- **tests**:`vitest run --coverage`(unit)/ `size-limit`(bundle)/ Playwright(e2e)
- **security**:`pnpm audit`

## 🤖 AI コーディングエージェント向け

リポジトリ固有の規約・非自明なパターンは [`AGENTS.md`](AGENTS.md) にまとめています。

## ⚖️ ライセンス

[MIT](LICENSE)
