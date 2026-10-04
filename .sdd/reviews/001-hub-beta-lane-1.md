## Critique

Trigger resolution: `specs/001-hub-beta-lane/pdca/do.md` は実装成果物ではなく、Task 1 の RED/GREEN/PROVE とゲート結果を記録する必須 workflow artifact であり、`_Boundary:_` 外の製品・テスト変更ではないため scope violation ではない。repository-level assertion の RED も、`tasks.md` で実データの正規化を 2.1/2.2、index 作成を 4.1、統合 Green を 4.2 が所有していること、および `do.md` が Task 1.1 を未完了のまま明記していることから、依存グラフと整合する。2026-10-04 の再実行でも 6 tests 中 5 passed / 1 failed で、失敗内容は当該 downstream files に限定されていた。したがって RED 自体は Task 1 の拒否理由ではないが、Task 1.1 を完了扱いにしてはならない。

### HIGH 遡及補正 record の starter commit 固定値を検査していない
**Location**: tests/repo/beta-lane.spec.ts:53
**Issue**: `2026-10-03-shadcn-tailwind.md` の `検証したコミット` が必須の `479bd2a` 以外でも repository test を通過する。
**Evidence**: spec 1.5 は「本リポジトリのコミット `479bd2a` は記録に書く」と定め、plan DES-5.1(7) もこの値を固定しているが、実装は全 record 共通の `/^- 検証したコミット: `[0-9a-f]{7,40}`$/` しか適用していない。
**Confidence**: high
**Fix**: retrospective exception file では starter commit を `479bd2a` に限定し、別 hash を拒否する negative fixture と正しい例外 record の positive fixture を追加する。

### MEDIUM README channel 同期が pin から導出されず false-green になる
**Location**: tests/repo/beta-lane.spec.ts:114
**Issue**: package pin が stable や誤った prerelease channel に変わっても、README に固定文字列 `nightly` / `canary` / `alpha` が残っていれば channel 同期検査が通る。
**Evidence**: plan DES-5.3 は「channel は pin から `dev`→`nightly`、`canary`→`canary`、`alpha`→`alpha` と導く」と要求する一方、実装の `expectations` は channel を定数で持ち、`exactVersionPattern` も `7.1.0` のような stable exact version を許容する。
**Confidence**: high
**Fix**: version suffix から channel を解析して README 期待値を導出し、stable pin、別 channel、suffix 欠落を拒否する fixture を追加する。

### MEDIUM Agent UI の必須 fixture states が template contract に現れない
**Location**: docs/beta-lane/TEMPLATE.md:49
**Issue**: Agent UI 行は `fixture-only unit tests` とだけ記載し、承認待ち・承認済み・却下・ツール結果・ストリーミング中という Requirement 2.2 の必須 fixture states を future record の契約として要求していない。
**Evidence**: spec 2.2 は五つの UI message parts を明記するが、template の Required evidence は抽象的な `fixture behavior` に留まり、test も `Agent UI` という単語の存在しか検査しない（tests/repo/beta-lane.spec.ts:301-323）。一方、無改変コピー、Gate matrix 参照、approval flow/API/persistence 禁止、hub decision boundary は template に正しく記載されている。
**Confidence**: high
**Fix**: Agent UI 行に五つの fixture states を列挙し、template test で各 state、無改変 source、fixture-only、Gate matrix anchor、禁止事項、hub decision boundary を個別に検査する。

### MEDIUM index の link target と取り込み先の値域を検証していない
**Location**: tests/repo/beta-lane.spec.ts:168
**Issue**: index link は basename だけで照合されるため別 directory を指す壊れた相対 link が通り、取り込み先も任意の非空文字列で通る。
**Evidence**: `basename(target)` を `recordFiles` と比較しているため `../wrong/2026-10-03-shadcn-tailwind.md` でも既存 record と同一扱いになり、row 検査は 5 列かつ非空だけで、plan DES-5.2 の「hub spec/PR または `未取り込み`」を確認しない。
**Confidence**: high
**Fix**: link target を `docs/beta-lane/README.md` から解決した正規化 path として確認し、期待する同 directory の相対 link のみ許可する。取り込み先は `未取り込み` または定義した hub spec/PR 形式に限定する negative fixtures を追加する。

### MEDIUM record の command/result ペアを repository test が強制しない
**Location**: tests/repo/beta-lane.spec.ts:71
**Issue**: `## 通したゲート` 見出しだけあれば、command/result の表や一対対応がなくても record validation が成功する。
**Evidence**: spec 1.2 は「通したゲート（コマンドと結果）」、plan DES-5.1(5) は command と result の対応付けを要求するが、`validateRecord` は heading の存在確認後に本文を検査しない。positive fixture に表はあるものの、表を壊す negative test がない。
**Confidence**: high
**Fix**: `通したゲート` section 内で command/result 列と少なくとも一つの非空 pair を検証し、command 欠落、result 欠落、空 row、section 外の偽 table を拒否する tests を追加する。

### LOW hold の禁止値検査は表記ゆれで回避できる
**Location**: tests/repo/beta-lane.spec.ts:60
**Issue**: `対象の据え置き` は完全一致の `該当なし` だけを拒否するため、`該当なし ` や `該当なし。` のような実質同じ値が通る。
**Evidence**: pattern は `/^- 対象の据え置き: (?!該当なし$).+$/` であり、plan DES-7 は concrete §8.1 row または ADR/spec obstacle を要求している。
**Confidence**: high
**Fix**: 値を trim・句読点正規化したうえで禁止語を拒否し、少なくとも §8.1 reference または ADR/spec と具体的障害を含む fixture を positive contract として固定する。

## Verdict
REQUEST_CHANGES

## Hallucination Signal
forced: false
