# Gap Analysis: 001-hub-beta-lane

## 要約

- **範囲**: 本 spec の大半は文書と手順（R1・R3〜R5）で、コードの追加は R2（ハブ部品のコピーとテスト）と、
  検知・形式を仕組みにするなら `scripts/` と `tests/` に限られる。新しい依存は要らない。
- **すぐ着手できるもの**: R1（索引の新設、既存 2 件の形式のずれの解消）と R5.3（README の WARNING の日付が古い）。
  既存 2 件は R1.2 の 5 見出しを満たしていない（それぞれ 2 見出しと 1 見出しが欠ける）。
- **外部待ち**: R2 はハブ spec `009` R1→R2 の完了待ち（ハブに `components/agent-ui/` はまだ無い）。R4 は Node 26 の
  Active LTS（2026-10-28）待ち。R3.2 は `openapi-typescript` の TS 7 対応版待ち。R5.2 は Next 16.4／Playwright 1.64 安定版待ち。
- **最大の課題**: R2 の「無改変コピー」と、ハブ spec `009` R2.3 の「props を `@vaz/schemas` から型付けする」が衝突する。
  本リポジトリに `@vaz/schemas` は無い。加えて、マウントしない部品は `build`／`size` の JS 予算では測られないが、CSS には入る。
- **検知条件の弱さ**: `openapi-typescript` の peer は TS 6 で動く現状でも `^5.x` のまま。R3.1 の「peer が `^7` を含む」は
  見逃しうる。挙動（プローブ）で判定する案を推す材料がある。
- **推奨の出発点**: 案 C（形式は Vitest の repo テストで CI に乗せ、検知とプローブは手作業）。R2 の受け皿は、
  ハブの部品設計を見てから R2-iii（ハブへ中立 props を要望）→ R2-i（型 shim）の順で検討する。

## 調査した既存資産

調査日 2026-10-03。本リポジトリ `claude/repo-update-specs-xctkdv`@`88e893e`、ハブ `vaz-agentic-ai-next` のローカル
クローン（`009-agent-ui-and-beta-intake` ブランチ、`main` 側の最新マージは `afbe6eb`）。

| 資産 | 場所 | 本 spec との関係 |
|---|---|---|
| 検証記録 2 件 | `docs/beta-lane/2026-10-03-shadcn-tailwind.md`、`docs/beta-lane/2026-10-03-ts7-compiler-api.md` | R1 の形式の原型。見出しは 2 件で揃っていない（R1 参照） |
| 記録の索引 | なし（`docs/beta-lane/README.md` は存在しない） | R1.4 で新設 |
| プレリリース追跡 | `scripts/check-updates.mjs`（`mise run outdated` の後段） | exact pin のプレリリースだけを読む。依存に無いパッケージ（`openapi-typescript`）や peer は見ない（R3.1） |
| UI 部品 | `src/components/ui/{button,card,input,native-select}.tsx`、`src/lib/utils.ts`（`cn()`） | ハブと同じ `@/components/ui`・`@/lib/utils` の配置。agent-ui の受け皿になる（R2） |
| ツール part の描画 | `src/sections/chat/Chat.tsx:56`（`case "tool-getCurrentTime"`） | 承認・ツール結果の表示は無い。agent-ui は既存画面と独立に置く |
| 型・lint の設定 | `tsconfig.json`、`biome.json`、`vitest.config.ts` | ハブの `packages/config/tsconfig.base.json` と strict 系フラグはほぼ同一（`verbatimModuleSyntax`・`erasableSyntaxOnly`・`noUnused*`）。Biome もタブ・100 桁で同じ。ハブは `reactCompiler: true`、本リポジトリは無効 |
| カバレッジ閾値 | `vitest.config.ts`（`src/**` に lines / functions 80%） | agent-ui を `src/` に置くとテストで閾値を保つ必要がある |
| CSS 予算 | `package.json` `size-limit`（CSS 6 kB、現状 3.89 kB） | Tailwind は `src/` を走査するので、マウントしない部品のクラスも CSS に入る（R2.3） |
| CI | `.github/workflows/{lint,tests}.yml` | Node は `jdx/mise-action` で `mise.toml` から入る。`gate` タスクは無い |
| ハブの Node 固定 | ハブ `mise.toml:2`（`node = "24"`）、`apps/worker/Dockerfile:19`（`ARG NODE_VERSION=24`）、`tests/repo/container-toolchain-pins.spec.ts:44`（Dockerfile と mise の major 一致を検査）、ルート `package.json` の `@types/node` `^24.19.0`、`tests/repo/dependabot.spec.ts:36` の `HELD_BACK` | R4.2 の列挙対象。ハブ CI は全 workflow が `mise-action` 経由なので、CI 側に Node の版を書いた箇所は無い |
| ハブの agent-ui | `apps/web/src/components/` は**まだ存在しない**（ハブ spec `009` R1〜R2 は未着手） | R2 のトリガーは未発火 |
| ハブの `@vaz/schemas` | `packages/schemas`（`exports: "./*": "./src/*.ts"`、zod 依存）。`JobEvent` は `workflows.ts:227` | ハブ spec `009` R2.3 が部品の props をここから型付けすると定めている。本リポジトリには無い（R2 の最大の統合課題） |

外部の状態（2026-10-03 に npm registry と `nodejs/Release` の `schedule.json` で確認）:

| 対象 | 状態 |
|---|---|
| `openapi-typescript` | `latest` 7.13.0。peer は `typescript: "^5.x"`（TS 6 でも動くが peer には含まれない） |
| `typescript` | `latest` 7.0.2、`next` 7.1.0-dev.20261003.1（本リポジトリは 20261001.1） |
| `next` | `latest` 16.3.8、`canary` 16.4.0-canary.58（本リポジトリは canary.57）。16.4 安定版は未公開 |
| `@playwright/test` | `latest` 1.63.0、`next` 1.64.0-alpha-2026-10-03（本リポジトリは 2026-10-02）。1.64 安定版は未公開 |
| Node.js 26 | Active LTS 開始 **2026-10-28**（25 日後）。Node 24 は 2026-10-20 に Maintenance へ移る |

## 要件ごとのギャップ

### Requirement 1: 検証記録の形式

| AC | 判定 | 根拠 |
|---|---|---|
| 1.1 ファイル名規約 | ✅ | 既存 2 件が `docs/beta-lane/YYYY-MM-DD-<topic>.md` に従う。`.sdd/steering/structure.md`「Where Things Go」にも記載済み |
| 1.2 5 つの見出し | 🔧 | 既存 2 件とも 5 見出しが揃っていない。shadcn 記録は「結論／変更内容／計測／通したゲート／ハブへ持ち込むときの注意」で「検証した版」「再現手順」が無い（版は「計測」表の中）。TS 7 記録は「結論／検証した版／結果／その他／手順案／再現手順」で「通したゲート」が無い（「結果」に含まれる）。AC は「as the two existing records do」と書くが、実態と合わない |
| 1.3 §8.1 の行と解消度 | 🔧 | TS 7 記録は §8.1 の `typescript` 6.x 行を挙げ「半分だけ解消」と書く。shadcn 記録は §8.1 の据え置きではなく ADR-0008 に向けた検証で、対応する §8.1 の行が無い。§8.1 に行を持たない検証（UI 部品の R2 も同じ）の書き方が未定義 |
| 1.4 索引 `docs/beta-lane/README.md` | 🆕 | 存在しない。消費したハブ側は shadcn → ハブ spec `009` R1〜R4、TS 7 → `009` R5 と spec.md の表から埋められる |
| 1.5 ハブの対象コミット | 🔧 | TS 7 記録は `main`@`1a08a97` を書く。shadcn 記録は本リポジトリ側の `1ae3fbd` だけでハブのコミットが無い |

**ギャップの性質**: 主に文書。既存 2 件を新形式に合わせて直すか、新しい記録から適用するかは spec が決めていない。
形式を機械的に守らせる仕組み（見出しや索引の漏れを落とすテスト）は無い。ハブには `tests/repo/doc-links.spec.ts` のような
repo ガードがあるが、本リポジトリの `tests/` にはその種のテストが無い。

### Requirement 2: ハブのエージェント UI 部品

| AC | 判定 | 根拠 |
|---|---|---|
| 2.1 無改変コピー | 🆕（未発火） | ハブに `apps/web/src/components/agent-ui/` がまだ無い。ハブ spec `009` は R1（Tailwind 導入）→ R2（部品）の直列で、R2 の着手は R1 のマージ後 |
| 2.2 fixture による単体テストのみ | 🆕 | `tests/Chat.spec.tsx` に Testing Library のパターンがある。承認待ち等の UI message part の fixture は無い。`tests/helpers/mockModel.ts` はモデル用で、part の fixture には使えない |
| 2.3 プレリリースでの 4 ゲート | 🔧 | `typecheck`・`vitest` はそのまま効く（`tests/tsconfig.json` が `src/**` を含む）。`build`・`size` は、部品がどのページからも import されないと JS には入らず、型も `next build` では見られない。一方 CSS は Tailwind が `src/` を走査するので、部品のクラスがマウント無しでも CSS に入る（予算 6 kB に対し現状 3.89 kB） |
| 2.4 変更の記録と報告 | 🔧 | R1 の記録形式に依存。「ハブへ報告」の経路（ハブの Issue か、記録のリンクか）は §8.2-1 の「PR かドキュメント」以上の定めが無い |
| 2.5 独自拡張しない | ✅（方針） | constitution 原則 1、product.md「ハブを正本にする」と一致。守らせる仕組みは無い |

**統合上の主な障害（無改変コピーとの衝突）**:

1. **`@vaz/schemas` が無い。** ハブ spec `009` R2.3 は props を `@vaz/schemas` と AI SDK v7 の型で付けると定める。
   本リポジトリには `@vaz/schemas` が無いので、`import type { JobEvent } from "@vaz/schemas/workflows"` のような行は
   そのままでは解決しない。R2.3 の注記「兄弟リポジトリへコピーしたときに依存が切れないように」は、
   `@vaz/schemas` 自体を兄弟リポジトリが持つ前提なのか、部品が `@vaz/schemas` を型でしか参照しない前提なのかが曖昧。
   `@vaz/schemas` の型は `z.infer` なので、型を解決するには zod とスキーマ本体も要る（type-only import なら client
   バンドルには入らない。constitution 原則 3 の「クライアント共有定義は Zod 非依存」は値の import の話で、type import は違反しない）。
2. **テーマトークンの差。** ハブ spec `009` R2.5 はトークンを `from-genai-to-agentic-ai` のものに合わせるとする。
   本リポジトリの `src/app/globals.css` は shadcn new-york の既定トークン。ハブ部品が独自トークン
   （例: 承認／却下の色）を使うと、無改変コピーでは未定義のユーティリティになる。
3. **React Compiler の有無。** ハブは `reactCompiler: true`。部品が手動メモ化なしで書かれていても動作は変わらないが、
   再描画回数に依存するテストがあれば差が出る。
4. **カバレッジ閾値。** `src/` に置くので、部品のテストが 80% を満たさないと `test:coverage`（CI の unit ジョブ）が落ちる。
5. **lint。** Biome の設定はハブとほぼ同じだが、ハブの Biome ドメイン設定と完全一致かは未確認。無改変を守るなら、
   違反が出たときに部品を直すのではなく lint の除外で受けるかを決める必要がある。

### Requirement 3: TypeScript 7 の残課題

| AC | 判定 | 根拠 |
|---|---|---|
| 3.1 `openapi-typescript` の追跡 | 🆕 | `scripts/check-updates.mjs` は `package.json` の exact pin プレリリースだけを読む。`openapi-typescript` は本リポジトリの依存に無く、peer も見ていない |
| 3.2 TS 7 だけで再プローブ | 🔧 | 手順は TS 7 記録の「再現手順」1)・2) にある（手作業のスクラッチ）。ハブのスナップショットの場所（`packages/schemas/src/generated/*.snapshot.json`）も記録済み。自動化は無い |
| 3.3 ハブが外せる手順の明記 | 🔧 | TS 7 記録の手順案 5 が既に書いている。3.2 の記録で再掲すればよい |
| 3.4 TS 7.x 新マイナーでの再確認 | 🔧 | 手順は TS 7 記録の再現手順 3)。検知は `check-updates.mjs` の `stable` 列（`typescript` は nightly pin なので、7.1.0 安定版が出ると表示される）で足りる |

**注意点（検知条件の妥当性）**: `openapi-typescript` 7.13.0 の peer は `typescript: "^5.x"` で、TS 6 で動いている現状も
peer の外である。つまり上流は peer を実態に合わせて更新していない。「peer が `typescript@^7` を含む版」を待つ条件は、
上流が peer を直さないまま TS 7 対応を出した場合（あるいは `typescript/unstable/*` を使う別パッケージとして出した場合）に
検知を逃す。新しい版が出るたびに 3.2 のプローブ自体を流す（peer ではなく挙動で判定する）案を Plan で比べる価値がある。

**TS 7 の既定チャネル**: npm の `latest` は既に 7.0.2 で、ハブ spec `009` R5 が取り込み中。R5 がマージされると、
3.4 の「ハブに入れる組み合わせ」の TypeScript はハブの版そのものになる。

### Requirement 4: Node 26 の判断材料

| AC | 判定 | 根拠 |
|---|---|---|
| 4.1 ハブ相当の組み合わせでの検証 | 🔧 | 本リポジトリは既に Node 26.10 / `@types/node` `^26.6.4`（`mise.toml:2`、`package.json`）で 4 ゲートを CI で回している。不足は「Next 安定版 / ハブと同じ TypeScript」に差し替えた構成での実行で、TS 7 記録と同じくスクラッチのコピーで組む手順になる。Playwright はハブの版（安定 1.63）か本リポジトリの alpha かが未指定 |
| 4.2 `package.json` 以外の変更点 | 🔧 | 列挙対象は調査で特定済み: ハブ `mise.toml` `node = "24"`、`apps/worker/Dockerfile` `ARG NODE_VERSION=24`（`tests/repo/container-toolchain-pins.spec.ts:44` が major 一致を検査）、`@types/node` の `HELD_BACK`（`tests/repo/dependabot.spec.ts:36`）と `.github/dependabot.yml` の ignore、§8.1 の表、`CLAUDE.md` / `AGENTS.md`。**CI の Node 版はハブの workflow に書かれていない**（全 job が `jdx/mise-action` で `mise.toml` から取る）ので、AC の「CI の Node 版」は「`mise.toml` に従う」と書けば足りる。`apps/worker/package.json` の `engines` も確認対象 |
| 4.3 判断はハブ | ✅（方針） | constitution 原則 1・2、product.md の Out of Scope と一致 |

**タイミング**: Node 26 の Active LTS は 2026-10-28。トリガーは 25 日後に発火する。ハブ `apps/worker` の Docker
イメージ `node:26-slim` の公開状況も、そのとき合わせて確認が要る（コンテナで動くのは worker だけ）。

### Requirement 5: プレリリース版の安定版への切り替え

| AC | 判定 | 根拠 |
|---|---|---|
| 5.1 exact pin と 24h | ✅ | `package.json` の 3 つが exact pin、`pnpm-workspace.yaml` の `minimumReleaseAge`、`check-updates.mjs` が cutoff で絞る。constitution 原則 6 |
| 5.2 安定版の検知と評価 | 🔧 | 検知は `check-updates.mjs` の `stable` 列と末尾のメッセージで実装済み。評価手順は README「プレリリース版の更新」の 3 手順（`tests.yml` の e2e を公式コンテナへ戻す手順を含む）。「挙動が違えば記録」の判断基準は未定義 |
| 5.3 README との同期 | 🔧 | README の技術スタック表と WARNING は手で保っている。WARNING の「執筆時点（2026-09）」は既に古い。自動の照合は無い |

現時点で安定版が出ているのは無い（Next 16.4 / Playwright 1.64 / TS 7.1 とも未公開）。pin の更新候補はある
（Next canary.58、TS 20261003.1、Playwright alpha-2026-10-03）が、`minimumReleaseAge` を満たすかは `mise run outdated` で見る。

## 統合上の課題

1. **R2 の「無改変コピー」とハブ側の型依存（`@vaz/schemas`）。** 本 spec 最大の衝突点。ハブ spec `009` R2.3 と
   本 spec R2.1・R2.5 の組み合わせで、受け皿（パス解決・zod・スキーマ本体）が要るかどうかが決まる。
   ハブ側の部品設計が固まる前に、ハブへ「部品は `@vaz/schemas` を型でだけ参照し、兄弟リポジトリでも解決できる形にする」
   ことを要望する手もある（ハブ側の作業はハブ spec `009` の範囲。本 spec Out of Scope の「ハブへの直接の変更」には当たらない要望として扱う）。
2. **R2 は外部の進捗待ち。** ハブ spec `009` は R1 → R2 の直列で、両方とも未着手。本 spec のタスクを
   「トリガー前に準備できるもの」（fixture の型、配置、lint／カバレッジの扱い）と「トリガー後」に分ける必要がある。
3. **CSS 予算。** マウントしない部品でも Tailwind が `src/` を走査するので CSS が増える。残り約 2.1 kB。
   部品が多いと 6 kB を超え、constitution 原則 5（予算の変更には承認済み spec／plan が要る）に触れる。
4. **`build`／`size` が部品を測らない。** どのページからも import しないと JS 予算と `next build` の型検査の対象外。
   R2.2 は「画面を作らない」とするが、承認の判定・永続化を伴わない fixture 表示ページ（例: 開発用の `/agent-ui` ）なら
   R2.2 と両立するかは解釈が要る。作るなら constitution 原則 1（ハブ機能を複製しない）と product.md の軽量性に照らした説明が要る。
5. **R1 の遡及適用。** 既存 2 件は新形式を満たしていない。直すと、ハブ spec `009` が既にリンクしている記録の見出しが変わる
   （アンカーリンクを張っていれば壊れる）。
6. **ゲートの不在。** constitution 原則 5 は `mise run gate` があればそれを使えとする。本リポジトリには無く、
   R2.3 の 4 ゲートと R4.1 のゲート列挙を毎回個別に打つことになる。本 spec の範囲で `gate` を足すかは Plan で決める
   （AGENTS 指示は追加を推奨している）。
7. **ハブ相当構成の組み方。** R3.4・R4.1 ともに「本リポジトリのソースを、版だけハブに合わせたスクラッチのコピー」で動かす。
   TS 7 記録は手作業（`git archive` + `package.json` の書き換え）で、再現性は記録の文章に頼っている。

## 実装アプローチの選択肢

### 案 A: 文書と手作業プローブで進める（既存を延長）

- 内容: `docs/beta-lane/README.md` と記録テンプレート（`docs/beta-lane/TEMPLATE.md` など）を足す。R3・R4・R5 のトリガーは
  `mise run outdated` 時に人が確かめ、プローブは記録の「再現手順」を手で流す。R2 は発火時に手でコピーし、受け皿は
  その時点で決める。
- 合う場面: 検証の頻度が低く（月に数件）、記録が人に読まれることが主目的のとき。
- コスト: 低。コード変更は R2 の部品とテストだけ。
- リスク: 形式の崩れ・索引の漏れ・トリガーの見落としを検知できない。R3.1 の peer 判定の弱さが残る。

### 案 B: 検知と形式を仕組みにする（新規構築）

- 内容: (1) `check-updates.mjs` に「依存に無い監視対象」（`openapi-typescript` の最新版と peer、Node の LTS 状態）を足すか、
  別スクリプト `scripts/check-beta-triggers.mjs` を作る。(2) `tests/repo/beta-lane.spec.ts` で、各記録の 5 見出し・
  §8.1 の行の明記・索引への登録を検査する。(3) ハブ相当構成を組むスクリプト（例: `scripts/hub-equivalent.mjs` で
  スクラッチに `git archive` し版を差し替える）と `mise run gate` を足す。
- 合う場面: 記録が今後も増え、ハブ側が記録の形式に依存するとき。
- コスト: 高。スクリプト 2〜3 本とテスト。ネットワークを引くスクリプトは CI に入れられない（constitution 原則 4）ので、
  ローカル専用になる。
- リスク: スターターに検証用の仕組みが増え、軽量性（原則 1、product.md）と衝突する。ハブ相当構成のスクリプトは
  ハブ側の版の変化に追随する保守が要る。

### 案 C: 形式だけ仕組みにし、検知とプローブは手作業（ハイブリッド）

- 内容: 記録の形式と索引は `tests/repo/` の Vitest テストで守る（ネットワーク不要なので CI に乗る）。トリガー検知は
  `check-updates.mjs` に `openapi-typescript` の最新版の表示だけを小さく足し、判定は 3.2 のプローブ（挙動）で行う。
  R2 は受け皿（`@vaz/schemas` の扱い、fixture、lint／カバレッジの扱い）を先に決めて文書化し、コピー自体は発火時に行う。
- 合う場面: CI で自動判定できる部分だけ機械化し、外部状態に依存する部分は人に残したいとき。
- コスト: 中。テスト 1 本と既存スクリプトへの小さな追加。
- リスク: 既存 2 件の遡及修正がテスト導入の前提になる（課題 5）。

| 観点 | A | B | C |
|---|---|---|---|
| 軽量性（原則 1） | ◎ | △ | ○ |
| 形式の担保（R1） | △ | ◎ | ◎ |
| トリガーの見落とし（R3〜R5） | △ | ◎（ローカルのみ） | ○ |
| CI での自己完結（原則 4） | ◎ | △（ネットワーク部分は CI 外） | ◎ |
| 工数 | 小 | 大 | 中 |

R2 の受け皿は A〜C と独立に選ぶ:

| 受け皿案 | 内容 | 長所 | 短所 |
|---|---|---|---|
| R2-i: 型の shim | `tsconfig` と `vitest.config.ts` に `@vaz/schemas/*` → `src/vendor/vaz-schemas/*`（必要な型だけ）を足す | 部品は無改変。zod 本体は不要 | shim がハブの型とずれる。ずれを検知する手段が無い |
| R2-ii: スキーマごとコピー | ハブ `packages/schemas/src` の該当ファイルを同じく無改変でコピー | 型が正確 | コピー範囲が広がる。ハブの機能（ジョブ）の型をスターターに持ち込む |
| R2-iii: ハブへ要望 | 部品の props を AI SDK の型と部品内の中立型だけにしてもらう（ハブ spec `009` R2.1 の「中立の props」に沿う） | 受け皿不要。ハブ R2.3 の目的とも一致 | ハブ側の判断待ち。本 spec 単独では決まらない |

## Plan フェーズで調べること

- **ハブ agent-ui の実際の import 先。** ハブ spec `009` R2 の設計（`design.md`／`plan.md`）が出たら、部品が
  `@vaz/schemas` を値で使うか型だけかを確認する。R2 受け皿案の選択はこれで決まる。
- **`openapi-typescript` の TS 7 対応の動き。** 上流の Issue／PR（`typescript/unstable/*` への移行や peer の更新方針）を
  調べ、R3.1 の検知条件を peer にするか挙動にするかを決める。
- **Node 26 LTS と `node:26-slim`。** 2026-10-28 の LTS 開始後に、Docker Hub の `node:26-slim` タグとハブ worker の
  依存（ネイティブモジュールの有無）を確認する。Next 16.3.x 安定版が Node 26 を `engines` で許しているかも確認する。
- **R4.1 の Playwright の版。** ハブ相当の構成でハブの Playwright（安定版）を使うか、本リポジトリの alpha を使うか。
- **R1.3 の「§8.1 に行を持たない検証」の書き方。** UI 部品（ADR-0008）のような検証で、何を「解消した障害」とするか。
  spec の追補か、記録テンプレートの定義で決める。
- **R1 の遡及。** 既存 2 件を新形式に直すか。ハブ spec `009` から記録内アンカーへのリンクがあるかを確認する。
- **CSS 予算への影響。** ハブの部品の規模が分かったら、Tailwind のユーティリティ増分を見積もる（現状の部品 4 つで約 1.9 kB）。
- **`mise run gate` の追加。** constitution 原則 5 との関係で、本 spec のタスクに含めるか。
