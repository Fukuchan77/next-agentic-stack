# <検証トピック>
- 対象ハブコミット: `<ハブ main の 7〜40 桁の commit hash>`
- 検証したコミット: `<本リポジトリの 7〜40 桁の commit hash>`
- 対象の据え置き: <`docs/dependency-policy.md §8.1 <行名・障害>` | `ADR-<番号> <具体的な採用障害>` | `spec <番号> <具体的な採用障害>`>
- 判定: <解消 | 部分解消 | 未解消>
- 未解決事項: <未解決事項の要約。ない場合は「なし」>

この template は、成功と失敗を同じ形式で記録するための contract である。判定はハブ側の据え置きや
採用障害に対する三値とし、検証対象そのものの採否はハブが決める。失敗、測定限界、未解決事項も
省略しない。

## 結論

`判定` の根拠を、`対象の据え置き` に書いた hold または採用障害と結び付けて説明する。
単に「動いた」「失敗した」だけで終えず、何が解消され、何が残ったかを書く。

## 検証した版

対象 dependency、runtime、framework、tool の exact version と channel を書く。イベントを契機に開始した
probe では、次の entry evidence も記録する。

- trigger kind: <発火した trigger>
- observed version: <観測した version または対象 commit>
- observed at: <ISO 8601 の観測日時>
- entry evidence: <release metadata、release note、hub commit などの根拠>

entry condition が成立する前に probe を開始しない。成立後も、対象 commit、実 file/import closure、
記録日を plan amendment で具体化し、design re-approval を得てから実装 task を作る。

## 通したゲート

`mise run <task>` を優先し、command と result を必ず一対で残す。必要な gate は独自に列挙せず、
[plan DES-5.6 Gate matrix](../../specs/001-hub-beta-lane/plan.md#gate-matrix-des-56) の対象レーンを参照する。
失敗した command も削除せず、その failure と測定限界を result に書く。

| Command | Result |
| --- | --- |
| `mise run <task>` | <pass/fail、件数、主要な出力> |

## ハブへ持ち込むときの注意

設定 file を丸ごとコピーせず、再現手順と証拠だけをハブの
`docs/dependency-policy.md` §8 の手順で渡す。hub source を独自拡張せず、採否はハブ側で判断する。

### レーン別に残す証拠

| Lane | Entry condition / isolation | Required evidence |
| --- | --- | --- |
| Agent UI | ハブ `main` への source landing、対象 commit と import closure の確定後、repo copy と temporary scratch bundle entry で隔離する | hub source の無改変コピーを diff/checksum で示す。承認待ち、承認済み、却下、ツール結果、ストリーミング中の 5 states を fixture-only unit tests で検証し、fixture behavior、互換性差分、CSS/JS budget を記録する。Gate matrix の Agent UI 行を通し、独自の approval flow、API、persistence、showcase route を追加しない。採否はハブ側で判断する |
| TS 7-only codegen | metadata または公式 release note が TS 7 対応候補を示した後、TS 7-only scratch workspace で実行する | ハブの 2 generated files との byte comparison と、隔離した TS 6 step を削除できるかを記録する |
| TS 7 stable minor | 前回の記録より新しい TS 7.x stable minor が公開後 24 時間を経過した後、hub-equivalent stable scratch で実行する | 前回記録の stable minor との差分、`next typegen` と `next build` の結果を記録する |
| Node 26 | 公式 metadata が Node 26 Active LTS を示した後、対象ハブ commit の archive で実行する | hub-equivalent 条件、Node 以外の pin を維持した証拠、必要だった変更点の全一覧、hub gate の結果を記録する |
| Stable transition | 対応 stable が公開後 24 時間を経過した後、dependency ごとの隔離した変更で評価する | prerelease baseline と stable result の差分、採否判断の材料を記録する。差分がなかった場合も「差分なし」の記録を残す |

Agent UI の source が中立な props で動かない場合も shim や独自 extension を自動追加せず、その差分を
ハブへ報告して plan amendment に戻る。

## 再現手順

clean checkout または plan が定める scratch workspace から再現できる command を、実行順に記載する。
必要な fixture、対象 commit、version pin、比較 command、期待する success/failure を含める。秘密情報や
実 LLM への接続を再現条件に含めない。

```bash
# Example only. Replace with the exact commands used by the verification.
git switch --detach <検証したコミット>
mise install
mise run <task>
```
