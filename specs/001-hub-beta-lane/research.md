# 001-hub-beta-lane — Discovery & Research Log

Created during `/sdd-plan`. Records investigations, decisions, and risks that inform the design.

## Discovery type

既存システムの拡張（Light Discovery）。既存のベータ検証記録、更新確認スクリプト、Vitest、mise の品質経路を拡張し、新しい外部依存や製品機能は追加しない。

## Investigations

### 検証記録の現状と機械検査可能な契約

- **Question**: Requirement 1 を既存資産の最小拡張で継続的に担保できるか。
- **Findings**: 既存 2 記録は内容の大半を持つが、shadcn/Tailwind 記録は「検証した版」「再現手順」と対象ハブコミットがなく、TS 7 記録は必須見出し「通したゲート」ではなく「結果」を使う。索引は存在しない。`vitest.config.ts` は `tests/**/*.spec.{ts,tsx}` を収集し、coverage 対象は `src/**` のみなので、Node 環境の repository test を追加しても製品コード coverage を歪めない。
- **Evidence**: `docs/beta-lane/2026-10-03-shadcn-tailwind.md:7-67`; `docs/beta-lane/2026-10-03-ts7-compiler-api.md:7-105`; `vitest.config.ts:10-21`; `specs/001-hub-beta-lane/gap-analysis.md`「Requirement 1」。

### agent-ui の正本とコピー境界

- **Question**: ハブ部品の「無改変コピー」とスターターの軽量性・型境界を両立できるか。
- **Findings**: 2026-10-03 時点でハブに実ソースは未着地だが、ハブ spec `009` の plan は `ApprovalCard`、`ToolExecution`、`StreamingStatus` を中立 props の表示専用部品として設計し、`@vaz/schemas` や画面固有型は adapter 側で写像する方針を明記した。したがって本計画は shim や schemas コピーを先行導入せず、実ソース着地時に import closure を監査する。正本が中立 contract を破る場合はコピーを止め、ハブへ報告して plan を改訂する。
- **Evidence**: `../vaz-agentic-ai-next/specs/009-agent-ui-and-beta-intake/plan.md:62-84,294-304`; `../vaz-agentic-ai-next/specs/009-agent-ui-and-beta-intake/research.md:117-122`; `specs/001-hub-beta-lane/gap-analysis.md`「Requirement 2」。

### agent-ui の build / size 証拠範囲

- **Question**: 製品画面へ接続しない fixture 単体テストだけで Requirement 2.3 をどう証明するか。
- **Findings**: `typecheck` と Vitest は未マウントの source を直接検査でき、Tailwind は `src/` 全体を走査するため CSS 増分は通常の build/size に現れる。一方、未到達 component の client JavaScript は production chunk に含まれない。追跡対象 repository に承認フローや公開 showcase route を追加せず、scratch workspace にだけ全 component を import/render する temporary entry を置いて JS chunk と size を計測する。
- **Evidence**: `src/app/globals.css` の `source("../")`; `package.json:60-70`; `vitest.config.ts:14-21`; `specs/001-hub-beta-lane/gap-analysis.md`「Requirement 2」。

### TypeScript 7 / openapi-typescript のトリガー

- **Question**: Requirement 3.1 のトリガーを現在の更新確認へどう統合するか。
- **Findings**: `scripts/check-updates.mjs` は package.json 内の exact-pinned prerelease のみを npm registry で調べ、依存にない `openapi-typescript` は対象外である。2026-10-03 の npm registry 確認では最新版は `7.13.0`、TypeScript peer は `^5.x` であり、TS 7-only プローブの再実行条件は未成立。ただし peer 表記は実動作より遅れる可能性があるため、更新確認は最新版と peer を通知し、採用判定は Requirement 3.2 の再現可能な挙動プローブで行う。
- **Evidence**: `scripts/check-updates.mjs:23-25,40-72`; `pnpm view openapi-typescript@latest version peerDependencies --json`（2026-10-03: `7.13.0`, `typescript: ^5.x`）; `docs/beta-lane/2026-10-03-ts7-compiler-api.md:57-100`。

### Node 26 と安定版切替の現在地

- **Question**: Requirements 4 と 5 のどこまでを現在の計画で実行できるか。
- **Findings**: 現在日は 2026-10-03 であり、Node 26 Active LTS の予定日 2026-10-28 は未来なので Requirement 4 は未発火である。`mise run outdated` は Next `16.4.0-canary.57` と Playwright `1.64.0-alpha-2026-10-02` に対応する安定版を検出せず、npm latest も Next `16.3.8`、Playwright `1.63.0` だった。TypeScript nightly には 24 時間を満たす更新候補 `7.1.0-dev.20261002.1` があるが、これは安定版切替ではない。
- **Evidence**: `mise run outdated`（2026-10-03）; `pnpm view next@latest version --json`; `pnpm view @playwright/test@latest version --json`; `specs/001-hub-beta-lane/gap-analysis.md`「Requirement 4」「Requirement 5」。

### 品質経路と `gate` タスク

- **Question**: 本 feature で `mise run gate` を追加する必要があるか。
- **Findings**: constitution は `gate` が存在しない現状では `lint`、`typecheck`、`test:run`、`build` を最低経路とし、UI 変更時に `test:e2e` と `size` を追加する。Sync Impact Report は `gate` 追加を別 tooling change に明示的に延期している。本 feature は記録契約とイベント別プローブに集中し、`mise.toml` は変更しない。
- **Evidence**: `.sdd/memory/constitution.md` 原則 5 と Sync Impact Report; `.sdd/steering/tech.md`「Gate command」; `mise.toml`。

## Existing patterns to reuse

| Pattern | Location | Why reuse |
|---------|----------|-----------|
| 日付付き一検証一ファイル | `docs/beta-lane/2026-10-03-*.md` | 既存履歴と Requirement 1.1 を保つ |
| Node environment の Vitest | `tests/chatRoute.spec.ts:1` | repository filesystem test を jsdom から隔離できる |
| 全 `tests/**/*.spec.*` の収集 | `vitest.config.ts:14-15` | CI 設定変更なしで repository test を実行できる |
| npm registry の公開日時と 24h cutoff | `scripts/check-updates.mjs:18-21,41-71` | prerelease と監視対象の判定基準を統一できる |
| Testing Library の component test | `tests/Chat.spec.tsx` | agent-ui を実 API・実 LLM なしで fixture 駆動検証できる |
| `mise run <task>` の品質経路 | `mise.toml`; `.sdd/steering/tech.md` | 検証記録の再現コマンドをリポジトリ標準へ揃えられる |
| `git archive` による隔離 probe | `docs/beta-lane/2026-10-03-ts7-compiler-api.md:107-126` | 本体の lockfile と作業ツリーを変えずにハブ相当構成を再現できる |

## External dependencies

| Dependency | Version / state on 2026-10-03 | Purpose | Verified |
|------------|-------------------------------|---------|----------|
| `openapi-typescript` | latest `7.13.0`; TypeScript peer `^5.x` | TS 7-only codegen trigger | npm registry (`pnpm view`) |
| Node.js | 26.10 in starter; Active LTS trigger scheduled for 2026-10-28 | Hub runtime migration evidence | repository pins and prior gap research |
| Next.js | pinned `16.4.0-canary.57`; npm latest stable `16.3.8` | Stable transition trigger | `mise run outdated`; npm registry |
| `@playwright/test` | pinned `1.64.0-alpha-2026-10-02`; npm latest stable `1.63.0` | Stable transition trigger | `mise run outdated`; npm registry |
| TypeScript | pinned `7.1.0-dev.20261001.1`; eligible nightly `7.1.0-dev.20261002.1` | Beta compiler lane | `mise run outdated` |

新規 dependency は追加しない。install/postinstall の許可変更も行わない。

## Architecture decisions

### ADR-1: 文書契約を template + index + offline repository test で固定する

- **Context**: 人手だけでは必須見出し、対象 commit、三値結論、索引登録の欠落を再発させる。
- **Decision**: `docs/beta-lane/TEMPLATE.md` を記録 contract、`docs/beta-lane/README.md` を索引 contract とし、`tests/repo/beta-lane.spec.ts` が日付付き記録だけを列挙して両 contract をオフライン検査する。
- **Alternatives**: 文書レビューのみ（漏れを自動検知できない）、専用 parser dependency（軽量性に反する）。
- **Consequences**: 既存 2 記録を遡及補正する。未取込の索引欄は `未取り込み` を許容し、取り込み後に spec/PR へ置換する。

### ADR-2: §8.1 に直接の行がない検証も具体的なハブ障害へ結び付ける

- **Context**: agent-ui は dependency hold ではなく ADR/spec の導入判断を検証する。
- **Decision**: 記録は §8.1 の該当行を第一選択とし、該当行がない場合はハブ ADR/spec の具体的な保留条件を記載して、`解消` / `部分解消` / `未解消` を必須とする。単なる「該当なし」は認めない。
- **Alternatives**: UI 記録を Requirement 1 の対象外にする（2.4 と矛盾）。
- **Consequences**: template と test は hold reference を固定文字列ではなく、具体的参照 + 三値結論として検証する。

### ADR-3: 外部トリガーは通知と再現 probe を分離する

- **Context**: npm/Node release 状態は外部依存であり、CI をネットワーク必須にできない。
- **Decision**: `mise run outdated` は `openapi-typescript` の最新版と peer を通知する。実際の TS 7、Node 26、安定版切替は、イベント成立後に隔離 scratch で手動 probe を実行し、成功・失敗を同じ形式で記録する。
- **Alternatives**: CI で外部 release API を毎回照会（決定論性を失う）、完全手作業（トリガーを見落とす）。
- **Consequences**: peer は候補通知であり、最終判定は byte-identical output と gate 結果になる。

### ADR-4: agent-ui は source landing 後に import closure を固定し、無改変コピーする

- **Context**: source は未着地で、事前の shim や型コピーは正本からの分岐を招く。
- **Decision**: ハブの特定 main commit に source が着地した時点で file/import closure を記録し、中立 props の component source を無改変コピーする。fixture unit tests のみを追加し、画面・API・永続化・承認判定は追加しない。想定と異なる dependency があればコピーを止め、ハブ側の修正または plan amendment を要求する。
- **Alternatives**: `@vaz/schemas` shim、schema package の部分コピー、公開 showcase route。
- **Consequences**: 現時点の File Structure Plan には未発火ファイルを含めず、着地後に実ファイル名と記録日を plan へ追記してから tasks を生成する。

### ADR-5: ハブ相当 probe は対象ハブ commit の版を基準にする

- **Context**: starter の Playwright alpha や Next canaryを使うと Node 26 のハブ採用判断を分離できない。
- **Decision**: Node 26 probe は対象ハブ commit の Next、TypeScript、Playwright、アプリ source を維持し、Node runtime、`@types/node`、必要な pin だけを 26 系へ置換する。TS 7 probe も対象ハブ commit の 2 snapshots を入力にする。
- **Alternatives**: starter の全 prerelease stack で代用（ハブ相当にならない）。
- **Consequences**: ハブ CI に Node の直書きがない場合は、`mise.toml` 経由で全 jobs が変わることを記録する。

### ADR-6: prerelease から stable への切替は自動化しない

- **Context**: stable 公開だけでは互換性と 24h policy を満たしたことにならない。
- **Decision**: exact pin と `minimumReleaseAge` を維持し、対応 stable が 24h を満たした後に isolated branch/scratch で全 applicable gates を実行する。差分の有無にかかわらず検証記録を作り、README と Dependabot ignore を採用時に同期する。
- **Alternatives**: registry 検出時の自動 package update。
- **Consequences**: stable 未採用の判断も証拠として残る。TypeScript 7.x の「新しい minor」は直前の記録済み stable minor を基準に一度ずつ再検証する。

### ADR-7: 記録のメタデータは H1 直後の固定 5 行で表し、行全体を照合する

- **Context**: plan 初版はメタデータ項目名だけを定め、Markdown 上の書き方を決めていなかった。また `解消` は `部分解消`・`未解消` の部分文字列なので、部分一致では三値を区別できない（`/sdd-validate-plan` の指摘）。
- **Decision**: H1 直後に `- 対象ハブコミット:`、`- 検証したコミット:`、`- 対象の据え置き:`、`- 判定:`、`- 未解決事項:` の 5 行を置き、repository test は値全体を正規表現で照合する。
- **Alternatives**: YAML frontmatter（parser 依存が増えるか、手書き parser が要る）、本文中の自由記述（機械検査できない）。
- **Consequences**: TS 7 記録の既存の `対象:` 行はこの 5 行に置き換える（`検証したコミット` は 2026-10-03 の `/sdd-analyze` 指摘で追加。spec 1.5 と constitution 原則 2 の「対象コミット」を例外なく満たすため）。

### ADR-8: 版の組み合わせが一致するハブコミットがない既存記録は「不明（遡及補正）」とする

- **Context**: shadcn/Tailwind 記録はハブの source ではなく、ハブと同じ版の組み合わせで starter を検証した。記録のコミット（`479bd2a`、2026-10-03 04:31 UTC）の時点で、ハブ `main` の `apps/web` は `next ^16.3.7`（`04d6d83`）だった。`^16.3.8` は記録より後の `834f6f3`（06:43 UTC）で入った。
- **Decision**: `対象ハブコミット: 不明（遡及補正）` と書き、上の事実を「検証した版」節に残す。test は file 名の固定 allowlist でこの 1 記録だけに例外を認める。
- **Alternatives**: 近いハブコミットを推定で書く（検証していない対象を証拠として載せることになる）、記録を contract の対象外にする（1.4 の索引と矛盾する）。
- **Consequences**: 今後の記録は検証の開始時に対象ハブコミットを確定させる。

### ADR-9: registry だけで判定できないトリガーは索引の「待機中のトリガー」表で人が確認する

- **Context**: `openapi-typescript` の公式 release note による TS 7 対応宣言（3.1）、agent-ui の着地（2.1）、Node 26 Active LTS（4.1）は npm registry metadata だけでは判定できず、plan 初版の図はすべてのレーンが reporter から発火するように見えていた。
- **Decision**: `docs/beta-lane/README.md` にトリガー・確認方法・最終確認日の表を置き、`mise run outdated` を実行するたびに三つを確認する。reporter に release site、nodejs.org、ハブ repository の自動照会は追加しない。
- **Alternatives**: reporter が上流 release site、`nodejs.org/dist/index.json`、隣のハブ checkout を読む（ネットワーク先と隣の checkout の配置に依存が増える）。
- **Consequences**: 見落としの防止は手順に頼る。表の最終確認日が古いことがその兆候になる。

## Risks & open questions

- ⚠️ agent-ui の実 source/import closure は未確定 — mitigation: landing commit を entry condition とし、File Structure Plan を改訂してから task 化する。
- ⚠️ 未マウント component の JavaScript は通常の production size に含まれない — mitigation: scratch-only bundle entry で直接計測し、追跡対象 repository には製品 route を追加しない。
- ⚠️ `openapi-typescript` の peer 表記が実動作を過小評価する可能性 — mitigation: 通知と TS 7-only probe を分離し、peer だけで「未対応」と断定しない。
- ⚠️ 外部イベントごとの記録ファイル名は日付確定前に列挙できない — mitigation: 現 task は即時 scope だけを扱い、イベント発火時に plan/tasks を改訂する。
- ✅ 既存記録の見出し変更で外部 anchor が壊れる可能性 — 2026-10-03 にハブ `specs/009` を確認し、2 記録への参照はファイル単位だけだった。TS 7 記録の `## 結果` は `## 通したゲート` にそのまま改名する。
- ❓ agent-ui source が plan どおり中立 props を維持するか — to resolve in: Requirement 2 entry check。
- ❓ Node 26 Active LTS の実日、`node:26-slim`、Next stable の engine 対応 — to resolve in: 2026-10-28 以降の Requirement 4 probe。
