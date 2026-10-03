# 001-hub-beta-lane

## Project Description

2026-10-03 に、本リポジトリは統合ハブ `vaz-agentic-ai-next` の **TypeScript ベータ検証レーン**になった
（[README](../../README.md)「このリポジトリの役割」、ハブの spec `008` R4）。ハブは安定版チャネルで、
TypeScript 6 / Node 24 LTS / Next.js 安定版に留まる。本リポジトリはその次の版を先に動かし、
ハブの据え置きを外すための証拠を集める。結果はハブの `docs/dependency-policy.md` §8 の手順でだけハブへ届く。

これまでに 2 件の検証を終えている。

| 記録 | 結論 | ハブ側 |
|---|---|---|
| [shadcn/ui + Tailwind CSS v4](../../docs/beta-lane/2026-10-03-shadcn-tailwind.md) | ハブと同じ版でも通る。CSS は brotli 3.89 kB | ハブ spec `009` R1〜R4 で移行 |
| [TypeScript 7 と compiler API](../../docs/beta-lane/2026-10-03-ts7-compiler-api.md) | `next typegen` は通る。`openapi-typescript` は TS 6 を別パッケージに閉じ込めれば通る | ハブ spec `009` R5 で取り込み |
| （Vitest 5） | ハブへ取り込み済み（2026-10-03） | 完了 |

本 spec は、この役割を続けるための次の作業を定める。散文は日本語、識別子・パス・コードは英語。

### 守ること（README の方針の再掲）

- 本番相当の機能（認証・RBAC・耐久ワークフロー・承認フロー・RAG・Python API レーン）はハブにある。
  本リポジトリは軽量なスターターのままにし、それらを複製しない。
- 設定ファイルをハブへ丸ごとコピーしない。ハブへ届けるのは手順と証拠である。

---

## Requirements

既定の主語は THE starter。[E]=Event-driven / [U]=Ubiquitous / [S]=State-driven。

### Requirement 1: 検証記録の形式

1.1 [U] 検証の記録 SHALL be written to `docs/beta-lane/YYYY-MM-DD-<topic>.md`, one file per verification.
1.2 [U] 各記録 SHALL contain the following sections, as the two existing records do:
「結論」「検証した版」「通したゲート（コマンドと結果）」「ハブへ持ち込むときの注意（または手順案）」「再現手順」。
1.3 [U] 各記録 SHALL name the hub hold it addresses（ハブ `docs/dependency-policy.md` §8.1 の行）and state whether that hold's
obstacle is resolved, partly resolved, or not resolved。単に「動いた」で終えない（§8.1）。
1.4 [U] `docs/beta-lane/README.md` SHALL index every record with its date, topic, conclusion, and the hub spec or PR that consumed it.
1.5 [U] 記録の対象はハブの `main` の特定コミットとし、そのコミットを記録に書く。

### Requirement 2: ハブのエージェント UI 部品をプレリリース版で確かめる

2.1 [E] WHEN the hub lands its agent UI components（ハブ spec `009` R2、`apps/web/src/components/agent-ui/`）,
the starter SHALL copy their source into `src/components/agent-ui/` without modification。
2.2 [U] 部品 SHALL be exercised only by unit tests with fixture UI message parts（承認待ち・承認済み・却下・ツール結果・ストリーミング中）。
承認の判定や永続化を伴う画面・API は作らない（承認フローを複製しない）。
2.3 [U] 部品 SHALL pass `typecheck`・`vitest`・`build`・`size` on the starter's prerelease toolchain（TS 7 nightly / Next canary / React 19.x）。
2.4 [E] IF a component needs a change to pass on the prerelease toolchain, THEN the change and its cause SHALL be recorded under
Requirement 1 and reported to the hub（ハブ側を直すか、ハブの次の版上げまで待つかはハブで判断する）。
2.5 [U] 部品の正本はハブとする。本リポジトリで部品を独自に拡張しない。

### Requirement 3: TypeScript 7 の残課題

3.1 [U] `openapi-typescript` の TS 7 対応 SHALL be tracked（`scripts/check-updates.mjs` か `mise run outdated` の確認時に、
peer 依存が `typescript@^7` を含む版が出たかを見る）。
3.2 [E] WHEN such a release appears, the starter SHALL re-run the probe of the existing TS 7 record against the hub's two snapshots
using TS 7 only（TS 6 なし）, and record whether the generated files are byte-identical to the hub's committed ones。
3.3 [U] 3.2 の記録 SHALL state the step the hub can drop（ハブ spec `009` R5.6: `packages/schemas` の TS 6 を外す）。
3.4 [U] TypeScript 7.x の安定版の新しいマイナーが出たら、ハブに入れる組み合わせ（Node 24 / Next 安定版 / TS 7.x 安定版）で
`next typegen` と `next build` の型検査を再確認する。

### Requirement 4: Node 26 の判断材料

ハブは `@types/node` を `^24` に留めている。理由は「ランタイムの Node 24 LTS に合わせている」で、
型だけを先に上げない方針である（ハブ §8.1）。本リポジトリは既に Node 26.10 で動いている。

4.1 [E] WHEN Node 26 enters Active LTS, the starter SHALL record a verification of the hub-equivalent combination
（Node 26 LTS / `@types/node` `^26` / Next 安定版 / ハブと同じ TypeScript）: `typecheck`・`vitest`・`build`・`playwright`。
4.2 [U] 4.1 の記録 SHALL list what the hub must change beyond `package.json`: `mise.toml` の `[tools] node`、
`apps/worker/Dockerfile` の `ARG NODE_VERSION`（ハブの `tests/repo/container-toolchain-pins.spec.ts` が固定）、CI の Node 版。
4.3 [U] Node のランタイムを上げるかどうかはハブが決める。本リポジトリは判断材料を記録するところまでとする。

### Requirement 5: プレリリース版の安定版への切り替え

5.1 [S] WHILE a prerelease (TS nightly / Next canary / Playwright alpha) is in use, it SHALL stay exact-pinned
and satisfy `minimumReleaseAge`（24h）。
5.2 [E] WHEN a stable release covering the pinned prerelease appears (例: Next 16.4、Playwright 1.64), the starter SHALL evaluate
switching to it and record the result under Requirement 1 if behavior differs from the prerelease。
5.3 [U] README の技術スタック表と WARNING 節 SHALL be kept in sync with the pinned versions.

## Out of Scope

- 認証・RBAC・耐久ワークフロー・承認フロー・RAG・Python API レーンの実装（ハブにある）
- ハブのリポジトリへの直接の変更（ハブ側の作業はハブの spec `009` が扱う）
- Carbon の検証（本リポジトリは既に shadcn/ui + Tailwind へ移行済み）
