## Critique

Trigger resolution: `specs/001-hub-beta-lane/pdca/do.md` は Task 1 の RED/GREEN/PROVE を記録する workflow artifact であり、Task 1 の製品境界違反ではない。Pass 1 の starter commit 固定、pin 由来 channel、gate command/result、同 directory link、句読点付き `該当なし`、template 本文の Agent UI 5 states は解消済み。2026-10-04 の再実行では `mise run lint` と `mise run typecheck` が成功し、対象 suite は 16 tests 中 15 passed / 1 failed、全 suite は 62 tests 中 61 passed / 1 failed だった。唯一の RED の 17 diagnostics は `docs/beta-lane/README.md` 欠落（Task 4.1）と既存 2 records の未正規化（Tasks 2.1/2.2）だけで、Task 1 の境界 file に起因する diagnostics はない。したがって downstream ownership trigger は解消済みである。ただし Pass 2 の三つの contract 強化には、以下の false-green または形式不一致が残る。

### [MEDIUM] Agent UI の row-scoped test は 1 語しか検査能力を証明していない
**Location**: tests/repo/beta-lane.spec.ts:470
**Issue**: 5 states と境界語を row 内で個別に強制する実装にはなったが、negative test は `承認待ち` の diagnostic しか assert せず、他の必須語の row-scoped check が削除されても suite が検出できない（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: mutation は 5 states 全体を row 外へ移す一方、assertion は `Agent UI row に fixture state「承認待ち」がありません` の一件だけである（474–479 行）。文書全体の test（394–429 行）は各語が別位置に残っていても通るため、たとえば validator から `承認済み`、`却下`、`ツール結果`、`ストリーミング中`、`approval flow`、`API`、`persistence` の check を削除しても、この二つの test は green のままである。Task 1.2 はこれらを Agent UI entry contract の同じ row に固定することを要求する（tasks.md:51-54）。
**Confidence**: high
**Fix**: `requiredTexts` の各要素を一つずつ Agent UI row から row 外へ移す parameterized negative test にし、各要素固有の diagnostic を assert する。少なくとも source 無改変、5 states、fixture-only、Gate matrix、禁止 3 項目、hub decision boundary の全 branch を mutation で証明する。

### [MEDIUM] consumer validator は正しい値を受理する test がなく reject-all でも false-green になる
**Location**: tests/repo/beta-lane.spec.ts:482
**Issue**: `未取り込み` と識別可能な hub spec/PR reference を許す regex は追加されたが、accepted format の positive fixture がなく、consumer を常に不正とする実装でも non-repository tests が通る（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: consumer 専用 test は `local spec`、`PR someday`、`not a spec` が error になることだけを確認する（482–497 行）。現在 RED の repository assertion は index file 自体がないため valid consumer branch を実行しない。したがって `未取り込み`、`hub spec \`009\``、`hub PR #123`、hub PR URL の受理は test contract として未証明である。spec 1.4 と plan DES-5.2 は「hub spec/PR または `未取り込み`」という選択肢を要求する。
**Confidence**: high
**Fix**: 同一の有効な index fixtureに対し、`未取り込み`、番号付き hub spec、番号付き hub PR、許可する hub PR URL をそれぞれ入れて `validateIndex(...).toEqual([])` を確認する positive cases を追加する。invalid cases と対にして reject-all / accept-all の両方を失敗させる。

### [MEDIUM] §8.1 hold は具体的な row を識別しなくても通り、template も番号付き ADR/spec を明示しない
**Location**: tests/repo/beta-lane.spec.ts:49; docs/beta-lane/TEMPLATE.md:4
**Issue**: §8.1 branch は任意の 1 token が後続すれば concrete hold と判定し、template は ADR/spec に番号を要求していないため、「§8.1 row または番号付き ADR/spec と obstacle description」という format が境界 contract に固定されていない（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: `isConcreteHold` の §8.1 条件は `/§8\.1\s+\S+/` なので `§8.1 x` でも成功する一方、spec 1.3 はハブ `docs/dependency-policy.md` §8.1 の行を要求する。negative fixtures は `ADR` / `spec` 系だけで bare/曖昧な §8.1 reference を含まない（512–521 行）。また template は「§8.1 の行、または ADR/spec と具体的な採用障害」とだけ示し、validator が実際に要求する番号付き `ADR-<number>` / `spec <number>` を利用者へ示していない。
**Confidence**: high
**Fix**: template に許可形式を具体例付きで記載し、§8.1 は少なくとも hub document と row/obstacle text を識別できる形式、ADR/spec は番号と obstacle description を必須にする。§8.1・ADR・spec の各 branch に positive/negative fixtures を置き、`§8.1`、`§8.1 x`、番号なし ADR/spec、番号だけで obstacle がない値を拒否する。

## Verdict
REQUEST_CHANGES

## Hallucination Signal
forced: false
