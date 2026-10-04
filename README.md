<h1 align="center">🤖 Next Agentic Stack</h1>

<p align="center">
  Next.js App Router + Vercel AI SDK で AI エージェントアプリを作り始めるためのテンプレート。<br/>
  単体テスト・E2E テスト・CI・Lint/Format・バンドルサイズ監視・サプライチェーン対策を同梱。
</p>

## 🧪 このリポジトリの役割(TypeScript のベータ検証レーン)

2026-10-03 から、本リポジトリは統合ハブ
[`vaz-agentic-ai-next`](https://github.com/Fukuchan77/vaz-agentic-ai-next) の
**TypeScript ベータ検証レーン**を兼ねます。ハブは安定版チャネルで、TypeScript 6 / Node 24 LTS /
Next.js 安定版に意図的に留まっています。本リポジトリでは、それらの次の版(TypeScript 7 / Node 26 /
Next.js canary / Playwright alpha)を先に動かします。Vitest 5 は 2026-10-03 にハブへ取り込まれ、
両リポジトリで同じメジャーになりました。

- 検証記録の一覧と待機中のトリガーは [beta-lane index](docs/beta-lane/README.md) で管理します。
- 検証した結果は、ハブの `docs/dependency-policy.md` §8 の手順でだけハブへ持ち込みます。
  設定ファイルを丸ごとコピーすることはしません。ハブ側の据え置きにはそれぞれ具体的な障害があります
  (例: TypeScript 7 はネイティブ移植で JS の compiler API が無く、ハブが使う `openapi-typescript` や
  `next typegen` が動くかを示す必要がある。ハブの `docs/dependency-policy.md` §8.1)。
  検証では、その障害が解消したことを示します。
  TypeScript 7 の検証結果は [docs/beta-lane/2026-10-03-ts7-compiler-api.md](docs/beta-lane/2026-10-03-ts7-compiler-api.md)
  にあります(`next typegen` は通過、`openapi-typescript` は TS 6 を別パッケージに閉じ込めれば通過)。
- エージェント UI 部品の標準は、ハブの ADR-0008 で **shadcn/ui + Tailwind CSS** に決まりました。
  本リポジトリは 2026-10-03 に CSS Modules から shadcn/ui + Tailwind CSS v4 へ移行しました
  (検証記録: [docs/beta-lane/2026-10-03-shadcn-tailwind.md](docs/beta-lane/2026-10-03-shadcn-tailwind.md))。
  shadcn/ui + Tailwind を最新の React / Next.js canary / TS 7 の
  組み合わせで先に検証する場としても使います。
- 本番相当の機能(認証・RBAC・耐久ワークフロー・承認フロー・RAG・Python API レーン)はハブにあります。
  本リポジトリは軽量なスターターのままにして、それらを複製しません。

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
| UI / スタイル | [shadcn/ui](https://ui.shadcn.com)(new-york)+ [Tailwind CSS](https://tailwindcss.com)(`@tailwindcss/postcss`) | — / 4.3 |
| ツール/タスク管理 | [mise](https://mise.jdx.dev)(Node / pnpm バージョン + タスクランナー) | — |
| バンドルサイズ監視 | [size-limit](https://github.com/ai/size-limit) | 14 |
| シークレットスキャン | [gitleaks](https://github.com/gitleaks/gitleaks) | 8.30 |

> [!WARNING]
> TypeScript 7.1 nightly / Next.js 16.4 canary / Playwright 1.64 alpha を、
> `package.json` で**特定バージョンに exact pin**して使用しています。stable の検知は自動切替ではなく、
> 公開から 24 時間経過後に隔離評価を始める合図です([評価手順](#-プレリリース版の更新))。

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
| `anthropic` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL=claude-opus-5-5` |
| `openai` | `OPENAI_API_KEY` | `OPENAI_MODEL=gpt-6-sol` |
| `ollama` | なし(ローカルで `ollama serve`) | `OLLAMA_MODEL=granite4.2:latest` / `OLLAMA_BASE_URL=http://localhost:11434/v1` |

既定プロバイダは `AI_PROVIDER`(`anthropic` | `openai` | `ollama`、既定 `anthropic`)で指定します。Ollama は公式の OpenAI 互換 API に `@ai-sdk/openai-compatible` で接続します。

既定モデルはハブ(`vaz-agentic-ai-next`)と揃えており、`src/lib/ai/model-allowlist.ts` が唯一の定義です(各プロバイダの先頭が既定値。Ollama は `granite4.2:3b` / `gemma4:e2b` / `gemma4:e4b` も明示指定で使える選択肢として載せています)。モデル ID をほかのファイル(テストを除く)に直書きしないでください。

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
| 完了前の品質ゲート | `mise run gate` | lint → typecheck → test:run → build を直列実行 |

## 📁 フォルダ構成

機能(ドメイン)単位でコンポーネントとデータ取得を同居させる **feature-based colocation** を採用しています。

```text
src/
  app/                            # Next.js App Router
    layout.tsx                    # ルートレイアウト(metadata)
    page.tsx                      # トップページ(Server Component)
    globals.css                   # Tailwind の読み込みと shadcn/ui のテーマトークン(ダークモード含む)
    api/chat/route.ts             # チャット API(Route Handler。実体は lib/ai/chat-handler.ts)
  components/ui/                  # shadcn/ui の部品(ソースをコピーして所有する。components.json 参照)
  lib/
    utils.ts                      # cn()(clsx + tailwind-merge)
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
- **バンドルサイズのガードレール**:`size-limit` を CI で検査(クライアント JS 240 kB / CSS 6 kB、brotli)。

## 🔒 サプライチェーン対策

`pnpm audit`(既知 CVE 照合)だけでは防げない攻撃を `pnpm-workspace.yaml` で補完しています。

- `minimumReleaseAge: 1440`:公開から 24 時間未満のバージョンを解決しない(プレリリース版も 24 時間以上経過したビルドを選んで固定しており、例外は設けていない)。
- `allowBuilds`:install/postinstall スクリプトはデフォルトでブロックし、許可/拒否を明示。
- Node / pnpm のバージョンを `mise.toml` と `package.json`(`packageManager` / `engines`)で固定。
- CI で `pnpm install --frozen-lockfile` + `pnpm audit --audit-level=moderate`。
- Dependabot(`.github/dependabot.yml`)が npm と GitHub Actions の更新 PR を毎週作成する(`cooldown: 1 日` で `minimumReleaseAge` と整合)。`@playwright/test` は alpha の版番号形式の混在で誤ったダウングレード PR が作られるため対象外とし、`mise run outdated` で確認する。
- CI の `secret-scan` ジョブで gitleaks が全履歴をスキャンする。コミット前には `mise run secret-scan:staged` を推奨。

### 依存の最新チェック

最新機能の検証・試作用のテンプレートのため、作業を始める前など適宜 `mise run outdated` で最新状況を確認してください。範囲指定の依存は `pnpm outdated`、プレリリース固定(nightly / canary / alpha)は [`scripts/check-updates.mjs`](scripts/check-updates.mjs) が npm registry を確認します。reporter は `minimumReleaseAge` の 24 時間 cutoff を適用し、同じ channel の更新候補と対応 stable を表示します。さらに監視行として、`openapi-typescript` の latest・公開時刻・TypeScript peer/dependency range と、nightly の base に依存しない最新 TypeScript stable を表示します。TypeScript stable minor は、現在の [TS 7 記録](docs/beta-lane/2026-10-03-ts7-compiler-api.md) の 7.0 を比較基準にします。

registry の HTTP error、取得例外、不正 JSON が一件でもあれば、残りの package を処理して error 行を表示した後に non-zero で失敗します。古い結果を最新として扱いません。stable の表示は切替指示ではなく評価開始の合図です。実行後は [beta-lane index の待機中トリガー表](docs/beta-lane/README.md#待機中のトリガー)で、`openapi-typescript` の公式 release note、ハブへの agent-ui source の着地、Node 26 Active LTS も確認してください。reporter は読み取り専用で、`package.json` を書き換えません。

詳細な意思決定の記録は [`docs/REFACTORING_PLAN.md`](docs/REFACTORING_PLAN.md) を参照してください。

## 🔁 プレリリース版の更新

TypeScript 7.1 / Next.js 16.4 / Playwright 1.64 に対応する stable が表示されても、直接切り替えません。

1. `mise run outdated` で候補が公開から 24 時間以上経過していることを確認する。
2. 一つの依存だけを対象にした隔離変更を作り、プレリリース構成の baseline と stable 候補を比較する。
3. `mise run gate`(lint → typecheck → test:run → build を直列実行)を通し、影響範囲に応じて `mise run test:e2e` と `mise run size` も実行する。
4. 挙動差がある場合だけでなく差分がない場合も、版・対象 commit・コマンドと結果・採否を `docs/beta-lane/YYYY-MM-DD-<topic>.md` に記録する。
5. 記録した証拠を基に採用または据え置きを判断し、採用する場合だけ pin、lockfile、README、関連する CI/Dependabot 設定を同じ隔離変更で同期する。

## 🤝 CI

push のたびに GitHub Actions で以下を実行します。

- **lint**:`biome check` + `pnpm typecheck`(`next typegen` + `tsc`)/ gitleaks(secret-scan)
- **tests**:`vitest run --coverage`(unit)/ `size-limit`(bundle)/ Playwright(e2e)
- **security**:`pnpm audit`

## 🤖 AI コーディングエージェント向け

リポジトリ固有の規約・非自明なパターンは [`AGENTS.md`](AGENTS.md) にまとめています。
非交渉の開発原則とガバナンスは
[`.sdd/memory/constitution.md`](.sdd/memory/constitution.md) を正本とします。

## ⚖️ ライセンス

[MIT](LICENSE)
