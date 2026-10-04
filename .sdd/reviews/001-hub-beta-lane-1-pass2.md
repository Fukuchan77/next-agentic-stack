## Critique

Trigger resolution: `specs/001-hub-beta-lane/pdca/do.md` は Task 1 の RED/GREEN/PROVE を記録する workflow artifact であり、宣言境界外の製品・テスト変更ではない。`git status --short` では実装成果物は `tests/repo/beta-lane.spec.ts` と `docs/beta-lane/TEMPLATE.md` に限定され、workflow artifact と review のみが別 path にある。2026-10-04 の再実行は対象 suite が 12 tests 中 11 passed / 1 failed、全 suite が 58 tests 中 57 passed / 1 failed で、唯一の failure は repository-level assertion だった。その 17 diagnostics は `docs/beta-lane/README.md` の欠落（Task 4.1）と既存 2 records の未正規化（Tasks 2.1/2.2）だけであり、意図的 RED は downstream-owned files に限定されている。したがって risk trigger は解消済みで、Task 1.1 は引き続き未完了のまま扱うのが正しい。

Pass 1 の starter commit 固定（`479bd2a` の positive/negative fixtures）、pin suffix 由来 channel 判定、gate section 内の command/result pair、同 directory link 拒否、句読点付き `該当なし` の拒否、および template 本文への Agent UI 5 states と境界の追加は確認できた。ただし、後述の 3 点は remediation が要求 contract を十分に固定しておらず false-green を残している。

### [MEDIUM] Agent UI contract test が必須語の所在を検証せず false-green になる
**Location**: tests/repo/beta-lane.spec.ts:357
**Issue**: Pass 1 の Agent UI 指摘は template 本文では解消したが、test は必須語を文書全体で `toContain` するだけなので、5 states や禁止境界が Agent UI lane から削除され別 lane・説明文へ移っても通過する（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: test は `"Agent UI"`, `"承認待ち"`, `"承認済み"`, `"却下"`, `"ツール結果"`, `"ストリーミング中"`, `"approval flow"`, `"API"`, `"persistence"` を同じ `requiredText` 配列で検査するだけで（357-390 行）、Task 1.2 は「agent-ui の entry contract として」無改変コピー、fixture-only tests、Gate matrix、独自 approval flow/API/persistence 禁止を明記するよう要求する（tasks.md:51-54）。
**Confidence**: high
**Fix**: lane table を解析して `Agent UI` row の 3 cells を特定し、その row 内で 5 states、無改変 source、fixture-only、Gate matrix、禁止事項、hub decision boundary を個別に検証する negative fixtures を追加する。

### [MEDIUM] index の取り込み先検査が hub の具体的 consumer を要求していない
**Location**: tests/repo/beta-lane.spec.ts:234
**Issue**: Pass 1 の値域指摘は部分的にしか解消されず、`local spec`、`PR someday`、`not a spec` のような hub consumer を特定しない値も受理される（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: validator は `^(?:未取り込み|.*(?:\bspec\b|\bPR\b).*)$` に一致すれば通すが、spec 1.4 は「the hub spec or PR that consumed it」、plan DES-3.2 は「取込後の hub spec/PR reference」を要求する。
**Confidence**: high
**Fix**: `未取り込み` または識別可能な hub spec/PR reference の明示形式（例: `hub spec \`009\``、hub PR URL/番号）だけを許可し、`local spec`、番号なし `PR`、否定文を拒否する fixtures を追加する。

### [MEDIUM] hold reference は bare `ADR` / `spec` でも「具体的」と判定される
**Location**: tests/repo/beta-lane.spec.ts:83
**Issue**: 句読点正規化は追加されたが、参照判定が token の存在だけなので `- 対象の据え置き: ADR` や `- 対象の据え置き: spec` が具体的な採用障害なしで通過する（prior: REQUEST_CHANGES remediation partial）。
**Evidence**: condition は `/(?:§8\.1|ADR(?:-\d|\b)|\bspec\b)/i` であり、bare `ADR` と bare `spec` を許す一方、spec 1.3 は「ハブの ADR/spec が定める具体的な採用障害」を要求し、diagnostic 自身も「具体的な障害を参照する必要があります」と述べる。
**Confidence**: high
**Fix**: §8.1 は文書/row を識別できる後続説明を、ADR/spec は識別子または明示的 reference と障害説明を要求する。bare `ADR`、bare `spec`、`spec 該当なし` を拒否し、§8.1・ADR・spec の各 positive/negative fixtures を追加する。

## Verdict
REQUEST_CHANGES

## Hallucination Signal
forced: false
