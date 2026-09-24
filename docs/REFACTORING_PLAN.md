# リファクタリング計画: TypeScript 6 対応 & Vercel React Best Practices 検証

作成日: 2026-06-10

## 1. TypeScript 6.0 アップデート(完了)

`typescript` を `^5.9.0` → `^6.0.3` に更新済み。`tsc --noEmit`(src / tests 両方)、`tsc -b && vite build`、`vitest run`、`biome check` すべて成功。

TypeScript 6.0 は 9 つのコンパイラデフォルトを変更した破壊的リリースだが、本リポジトリへの影響はなかった:

| TS 6.0 の変更 | 本リポジトリへの影響 |
| --- | --- |
| `strict` がデフォルト `true` に | もともと明示的に `strict: true` のため影響なし |
| `moduleResolution: classic` の削除 | `bundler` を使用しているため影響なし |
| `esModuleInterop` / `allowSyntheticDefaultImports` が常時有効に | Vite + ESM 構成のため影響なし |
| TS 7(Go 製ネイティブコンパイラ)への布石 | 下記フォローアップ参照 |

### フォローアップ(任意・低リスク)

- [ ] `tsconfig.json` から `useDefineForClassFields: true` を削除(`target: ES2022` 以上ではデフォルトのため冗長)
- [ ] `verbatimModuleSyntax: true` を追加(型のみの import を強制。`UserCard.tsx` は既に `import type` を使用しており準拠済み)
- [ ] `erasableSyntaxOnly: true` を追加(enum / namespace 等の非消去構文を禁止し、TS 7 / Node.js type stripping への移行を容易にする)

## 2. Vercel React Best Practices 監査

[vercel-labs/agent-skills の react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices)(8 カテゴリ・70 ルール)に対して全ソースを検証した。

### 適用範囲の注記

本リポジトリは Vite 製クライアントサイド SPA のため、Next.js / React Server Components 前提のカテゴリ(Priority 3: Server-Side Performance 全 10 ルール、Priority 1 のサーバー系 async ルールの大半)は対象外。

### 準拠している点

- リストの `key` に index ではなく安定 ID(`user.id`)を使用(`rerender` 系)
- インラインコンポーネント定義なし(`rerender-no-inline-components`)
- 派生状態を `useEffect` で同期していない(`rerender-derived-state-no-effect`)
- `React.StrictMode` + `createRoot` の正しい初期化
- 型のみの import に `import type` を使用
- CSS Modules のスコープ化設定(開発/本番でクラス名生成を切替)

### 検出された課題と対応計画

#### F1: Carbon の全量 CSS 取り込み — `bundle-barrel-imports` 系(優先度: CRITICAL)

`src/assets/styles/global.scss` の `@use "@carbon/react"` が Carbon Design System の全スタイルを取り込み、Tile + Grid しか使っていないページで **CSS 811 kB(gzip 83 kB)** を出力している。JS も barrel import(`@carbon/react`)経由で 270 kB(gzip 85 kB)。

対応:
1. `@carbon/styles` のコンポーネント単位 SCSS(`@use "@carbon/styles/scss/components/tile"` 等)に切り替え、テーマ・グリッド・リセットのみ全体読込にする
2. ビルド後に `dist/assets` のサイズを計測し、効果を README に記録する
3. JS 側は Vite の tree-shaking が効いているか `rollup-plugin-visualizer` で確認し、不十分なら個別パス import を検討

#### F2: `useUsers` の参照不安定性と将来のデータ取得設計 — `client-swr-dedup` / `async-parallel`(優先度: MEDIUM-HIGH)

`useUsers()` はレンダーごとに新しい配列リテラルを返すため参照が不安定。現状は実害がないが、`memo` 化した子や `useEffect` の依存配列に渡した瞬間に無限再実行・無駄な再レンダーの温床になる。

対応:
1. 短期: 静的データをモジュールスコープの定数に巻き上げる(`rerender-lazy-state-init` / hoisting)
2. 中期: 実データ取得を導入する際は SWR か TanStack Query を採用し、リクエストの重複排除とキャッシュを得る(`client-swr-dedup`)
3. 複数リソースを取得する場合は `Promise.all` で並列化し(`async-parallel`)、`<Suspense>` 境界でストリーミング表示する(`async-suspense-boundaries`)

#### F3: コード分割の指針が未整備 — `bundle-dynamic-imports`(優先度: MEDIUM)

現状は単一ページのため分割不要だが、テンプレートとして「sections 配下が増えたらルート単位で `React.lazy` + `Suspense` で遅延読込する」という規約を AGENT.md / README に明文化する。重い第三者ライブラリ(チャート等)を導入する際は `bundle-defer-third-party` に従い動的 import にする。

#### F4: バンドルサイズの継続的ガードレール(優先度: MEDIUM)

ベストプラクティス準拠を一度きりにしないため、CI にサイズ監視を追加する:
1. `size-limit`(または `bundlesize`)を導入し、JS/CSS の gzip 上限を設定
2. `tests.yml` にステップを追加し、閾値超過で fail させる

#### F5: リソースヒント — `rendering-resource-hints`(優先度: LOW)

IBM Plex フォントは Carbon の SCSS 経由で読み込まれる。フォントを CDN 配信に切り替える場合は `index.html` に `preconnect` を追加する。現状はセルフホストのためアクションなし(記録のみ)。

## 3. 実施フェーズ

| フェーズ | 内容 | 状態 |
| --- | --- | --- |
| Phase 0 | TypeScript 6.0.3 アップデート + 全検証 | ✅ 完了(本ブランチ) |
| Phase 0.5 | 依存脆弱性 14 件(critical 1 / high 7 / moderate 6)の解消 | ✅ 完了(本ブランチ) |
| Phase 0.6 | Vite 8 アップデート + サプライチェーン対策(npm audit の限界を補完) | ✅ 完了(本ブランチ) |
| Phase 1 | F1: Carbon CSS のコンポーネント単位読込でバンドル削減 | ✅ 完了(本ブランチ) |
| Phase 2 | F2 短期: 静的データのモジュールスコープ化 / tsconfig フォローアップ | ✅ 完了(本ブランチ) |
| Phase 3 | F4: CI へのバンドルサイズガードレール追加 | ✅ 完了(本ブランチ) |
| Phase 4 | F2 中期 + F3: データ取得層(SWR/TanStack Query)とコード分割規約の整備 | 未着手 |

各フェーズは独立して PR 化できる粒度に設計している。Phase 1 が効果・リスク比で最優先。

## 4. 依存脆弱性の解消(Phase 0.5・完了)

Dependabot / `pnpm audit` が報告した 14 件(critical 1 / high 7 / moderate 6)を解消した。**全件 devDependencies の依存**であり本番バンドルには同梱されないが、修正版が全件存在するため対応した。

### 直接依存のバージョン更新

| パッケージ | 変更 | 解消した脆弱性 |
| --- | --- | --- |
| `vitest` / `@vitest/coverage-v8` | `^4.0.0` → `^4.1.8` | **CRITICAL** Vitest UI server 経由の任意ファイル読込/実行(GHSA-5xrq-8626-4rwp) |
| `vite` | `^7.3.0` → `^7.3.5` | HIGH `server.fs.deny` バイパス / MODERATE Optimized Deps の Path Traversal。plugin-react の peer 範囲(`^7`)維持のため 7.x 系最新に固定 |
| `sass` | `^1.85.0` → `^1.100.0` | 推移依存(immutable / picomatch)の更新を後押し |

### 推移的依存の固定(`pnpm.overrides`)

直接依存にぶら下がる脆弱パッケージは、メジャー更新を避けつつ `pnpm.overrides` の範囲指定で最小限パッチした:

| override | 対象経路 | 解消した脆弱性 |
| --- | --- | --- |
| `undici@>=7.0.0 <7.24.0` → `^7.24.0` | `jsdom > undici` | HIGH 3 件 + MODERATE 3 件(WebSocket overflow / メモリ枯渇 / CRLF・Smuggling 等) |
| `picomatch@>=4.0.0 <4.0.4` → `^4.0.4` | `sass > @parcel/watcher > picomatch` | HIGH ReDoS / MODERATE Method Injection |
| `postcss@<8.5.10` → `^8.5.15` | `vite > postcss` | MODERATE `</style>` 経由 XSS |
| `immutable@>=5.0.0 <5.1.5` → `^5.1.6` | `sass > immutable` | MODERATE |

対応後 `pnpm audit --audit-level=moderate` は **No known vulnerabilities found**。typecheck / lint / unit test(4 件)/ build すべてグリーンを確認済み(e2e はブラウザ取得がコンテナのネットワークポリシーで不可のため CI に委譲)。

## 5. Vite 8 アップデート + サプライチェーン対策(Phase 0.6・完了)

### Vite 8(Rolldown ベース)への更新

| パッケージ | 変更 |
| --- | --- |
| `vite` | `^7.3.5` → `^8.0.16`(バンドラが Rolldown に。ビルド時間 13.8s → 8.6s) |
| `@vitejs/plugin-react` | `^5.0.0` → `^6.0.2`(vite ^8 専用メジャー) |

`vitest@4.1.8` は vite ^8 を peer サポート済み。vite.config.ts の変更は不要で、typecheck / lint / unit test / build すべてグリーン。

### npm audit の限界を補完するサプライチェーン対策

`pnpm audit` は既知 CVE とのバージョン照合しかできず、(1) タイポスクワッティング、(2) 公開直後のマルウェア混入バージョン、(3) 悪意ある install スクリプトは検出できない(参考: [npm audit の限界と本当に必要なセキュリティ対策【2026年版】](https://zenn.dev/yuichi_ai/articles/npm-audit-limitations-real-security-2026))。以下を導入した:

| 対策 | 設定箇所 | 防御対象 |
| --- | --- | --- |
| `minimumReleaseAge: 1440`(公開24時間未満のバージョンを解決しない) | `pnpm-workspace.yaml` | 不正バージョン公開直後〜取り下げまでの最危険期間の取り込み |
| `ignoredBuiltDependencies` による install スクリプトの明示的拒否リスト(Carbon/IBM Plex のテレメトリ、esbuild/@parcel/watcher のビルドスクリプト計22件を監査のうえ拒否) | `pnpm-workspace.yaml` | install 時の任意コード実行 |
| pnpm のバージョン固定(`latest` → `10.33.0`) | `mise.toml` | ツールチェーン自体の不正バージョン自動取得 |
| `pnpm install --frozen-lockfile` + `pnpm audit` | CI(既存) | lockfile 改ざん・既知 CVE |

緊急のセキュリティパッチを 24 時間待たずに入れたい場合は `minimumReleaseAgeExclude` に対象パッケージを追加する。新しい依存がビルドスクリプトを必要とする場合は、内容を確認のうえ `onlyBuiltDependencies` に明示的に追加する運用とする。

## 6. Phase 1〜3 実装結果(完了)

### Phase 1: Carbon CSS のコンポーネント単位読込

`global.scss` の全量読込(`@use "@carbon/react"`)を、使用コンポーネント分のみの `@carbon/styles` 読込(reset / zone / fonts / type / grid / tile / ui-shell content)に置換。フォントの `@font-face` も IBM Plex Sans のみに限定した。`@carbon/styles` は pnpm の厳格な node_modules ではルートから解決できないため、直接依存として明示追加した。

| 計測値 | Before | After | 削減 |
| --- | --- | --- | --- |
| CSS | 811 kB(gzip 83.2 kB) | **104 kB(gzip 11.8 kB)** | **-87%** |
| ビルド時間 | 8.6s | 5.0s | -42% |

副次的な発見: この作業中、`minimumReleaseAge` が「公開 6 時間の `@napi-rs/wasm-runtime@1.1.5` が lockfile に混入していた」ことを検出した(導入前のインストールで取り込まれていた)。成熟版 1.1.4(4 月公開)に解決し直し、対策が実際に機能することを確認した。

新しい Carbon コンポーネントを使う際は `global.scss` に対応する `scss/components/*` を追記する運用とする(ファイル内コメントにも明記)。

### Phase 2: 参照安定性と tsconfig フォローアップ

- `useUsers` の静的データをモジュールスコープ定数 `USERS` に巻き上げ、レンダーごとの配列再生成を排除
- `tsconfig.json`: 冗長な `useDefineForClassFields` を削除、`verbatimModuleSyntax` と `erasableSyntaxOnly` を追加(TS 7 / Node.js type stripping 対応の布石)

### Phase 3: バンドルサイズガードレール

- `size-limit` + `@size-limit/file` を導入し、`pnpm run size` / `mise run size` で検査可能に
- 上限: JS 80 kB / CSS 12 kB(brotli。実測 JS 72.3 kB / CSS 8.5 kB に対し約 10〜40% のヘッドルーム)
- CI(`tests.yml`)に `bundle-size` ジョブを追加。閾値超過で fail するため、Carbon 全量読込への回帰や重い依存の安易な追加を機械的に防止する
