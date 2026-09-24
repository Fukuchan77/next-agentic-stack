<h1 align="center">⚡⚛️ Robust React + TypeScript Template</h1>

<p align="center">
  ベストプラクティスに沿って React アプリを作り始めるためのテンプレート。<br/>
  単体テスト・E2E テスト・CI・Lint/Format・バンドルサイズ監視・サプライチェーン対策を同梱。
</p>

## 🌈 技術スタック

| 領域 | 採用技術 |
| --- | --- |
| ビルド/開発サーバー | [Vite 8](https://vite.dev)(Rolldown ベース) |
| UI | [React 19.2](https://react.dev) |
| 言語 | [TypeScript 6.0+](https://www.typescriptlang.org) |
| Lint / Format | [Biome 2.5+](https://biomejs.dev)(ESLint + Prettier を一本化) |
| 単体テスト | [Vitest 4](https://vitest.dev) + [Testing Library](https://testing-library.com) |
| E2E テスト | [Playwright](https://playwright.dev)(Chromium / Firefox) |
| UI コンポーネント | [Carbon Design System](https://carbondesignsystem.com)(`@carbon/react`) |
| スタイル | CSS Modules + [Sass](https://sass-lang.com) |
| パッケージ管理 | [pnpm](https://pnpm.io) |
| ツール/タスク管理 | [mise](https://mise.jdx.dev)(Node バージョン + タスクランナー) |
| バンドルサイズ監視 | [size-limit](https://github.com/ai/size-limit) |

## 🚀 はじめに

前提: [mise](https://mise.jdx.dev) をインストール済みであること(Node と pnpm は mise が `mise.toml` の固定バージョンで用意します)。

```bash
mise install        # Node 24 / pnpm 10.33.0 を用意
pnpm install        # 依存をインストール
mise run dev        # 開発サーバーを http://localhost:3000 で起動
```

このテンプレートをベースに新規プロジェクトを作る場合は、`package.json` の `name` / `author` / `license`、`LICENSE` の著作者、`index.html` の `<title>`、`public/favicon.ico` を更新してください。

## 📜 タスク一覧

タスクは **mise** で管理しています(`mise.toml` が正)。`mise run <task>` または直接 `pnpm <...>` で実行できます。

| 用途 | mise | pnpm |
| --- | --- | --- |
| 開発サーバー | `mise run dev` | `pnpm dev` |
| 本番ビルド | `mise run build` | `pnpm build` |
| ビルドのプレビュー | `mise run preview` | `pnpm preview` |
| 単体テスト(watch) | `mise run test` | `pnpm test` |
| 単体テスト(一回) | `mise run test:run` | `pnpm test:run` |
| カバレッジ計測 | `mise run test:coverage` | `pnpm exec vitest run --coverage` |
| E2E テスト | `mise run test:e2e` | `pnpm test:e2e` |
| Lint/Format チェック | `mise run lint` | `pnpm lint` |
| Lint/Format 自動修正 | `mise run lint:fix` | `pnpm lint:fix` |
| 型チェック | `mise run typecheck` | `pnpm typecheck` |
| バンドルサイズ検査 | `mise run size` | `pnpm size`(要 build) |

## 📁 フォルダ構成

機能(ドメイン)単位でコンポーネント・フック・スコープド CSS を同居させる **feature-based colocation** を採用しています(型別の `components/` `hooks/` ではなく、関連するものを近くに置く現行のベストプラクティス)。

```text
src/
  index.tsx                       # エントリーポイント(createRoot + StrictMode)
  App.tsx                         # ルートコンポーネント
  assets/styles/global.scss       # グローバルスタイル(Carbon を使用分のみ読込)
  sections/{domain}/
    ComponentName.tsx             # 表示用(presentational)コンポーネント
    ComponentName.module.scss     # スコープド CSS Module
    useFeatureName.ts             # データ/ビジネスロジックを担うカスタムフック
tests/
  *.spec.tsx                      # Vitest 単体テスト
  setupTests.ts                   # Vitest グローバルセットアップ
  tsconfig.json                   # テスト用 tsconfig(vitest/globals 型を追加)
  e2e/
    *.spec.ts                     # Playwright E2E テスト
```

設計方針は React 公式の [Thinking in React](https://react.dev/learn/thinking-in-react) に準拠:UI をコンポーネント階層に分解し、state は単一の情報源(single source of truth)として最小限に保ち、データは一方向に流す。`App → useUsers(データ) / UserCard(表示)` のように、データ取得フックと表示コンポーネントを分離します。

## ✅ ベストプラクティス指針

[Vercel の React Best Practices](https://vercel.com/blog/introducing-react-best-practices)(8 カテゴリ・40+ ルール)を踏まえ、本テンプレートでは次を徹底します。

- **バンドル肥大の回避**(`bundle-barrel-imports`): UI ライブラリは barrel(`@carbon/react` の全量読込)ではなくコンポーネント単位で読み込む。`global.scss` も使用コンポーネント分の `@carbon/styles/scss/components/*` だけを `@use` する。
- **参照の安定性**(`rerender-lazy-state-init` 他): 静的データはモジュールスコープに巻き上げ、レンダーごとの再生成を避ける。
- **派生 state を `useEffect` で同期しない**(`rerender-derived-state-no-effect`): 派生値はレンダー中に算出する。
- **インラインコンポーネント定義の禁止**(`rerender-no-inline-components`): コンポーネントはモジュールトップレベルで宣言する。
- **リストの `key` は安定 ID**:index ではなく一意な ID を使う。
- **型のみの import は `import type`**:Biome の `useImportType` で強制。
- **バンドルサイズのガードレール**:`size-limit` を CI で検査し、回帰を機械的に防ぐ(JS 80kB / CSS 12kB brotli)。

### 今後の拡張時の規約

- **データ取得**:実データを扱う際は [SWR](https://swr.vercel.app) または [TanStack Query](https://tanstack.com/query) を採用し、リクエストの重複排除・キャッシュを得る(`client-swr-dedup`)。複数リソースは `Promise.all` で並列化する(`async-parallel`)。
- **コード分割**:`sections/` が増えてページ単位になったら、`React.lazy` + `<Suspense>` でルート単位の遅延読込にする(`bundle-dynamic-imports`)。重い第三者ライブラリ(チャート等)は動的 import で遅延させる。

## 🔒 サプライチェーン対策

`pnpm audit`(既知 CVE 照合)だけでは防げない攻撃を `pnpm-workspace.yaml` で補完しています。

- `minimumReleaseAge: 1440`:公開から 24 時間未満のバージョンを解決しない(不正バージョン公開直後の最危険期間を回避)。
- install/postinstall スクリプトはデフォルトでブロックし、許可するものだけ明示。
- pnpm 自体のバージョンを `mise.toml` で固定。
- CI で `pnpm install --frozen-lockfile` + `pnpm audit --audit-level=moderate`。

詳細な意思決定の記録は [`docs/REFACTORING_PLAN.md`](docs/REFACTORING_PLAN.md) を参照してください。

## 🤝 CI

push のたびに GitHub Actions で以下を実行します。

- **lint**:`biome check` + `tsc --noEmit`
- **tests**:`vitest run`(unit)/ `size-limit`(bundle)/ Playwright(e2e、公式コンテナイメージで実行)
- **security**:`pnpm audit`

## 🤖 AI コーディングエージェント向け

リポジトリ固有の規約・非自明なパターンは [`AGENT.md`](AGENT.md) にまとめています。

## ⚖️ ライセンス

[MIT](LICENSE)
