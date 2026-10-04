# Act Phase — 001-hub-beta-lane

PDCA Act: Check phase の結果を、再利用可能な成功 pattern と次 cycle の改善策へ変換する。

## Check Phase Summary

Immediate phase は計画どおり完成し、20/20 requirements の traceability、8/8 Immediate requirements の実装、2 件の Partial notification、10 件の Event-gated entry contract を確認した。12 files / 114 tests、lint、typecheck、隔離した production build、coverage、secret scan の証拠があり、製品 scope や dependency への drift はない。direct-root build は実行環境の port-bind 制限を受けたが、同じ source と依存を workspace 内一時 project で build して source regression ではないことを確認した。

## Outcome

**Success**

- **Success Rating**: 4.5/5
- **Production Readiness**: Immediate workflow は Ready。event-gated probe は trigger と再承認後に個別判定する Conditional。
- **Key Achievement**: 外部 trigger を待つ検証を、contract・trigger・probe の三層へ分離し、trigger 前でも testable な証拠 contract を完成させた。
- **Key Challenge**: task 間で意図的 RED を引き継ぐ運用と、sandboxed root で失敗する build の base/current 証明。

## Success Pattern

### Contract-first Event-gated Beta Validation

- **Problem**: 外部状態を待つ検証は、trigger 前の過剰実装と、待機中の証拠形式のばらつきを同時に招きやすい。
- **Solution**: 記録 contract と deterministic trigger notification を先に実装し、probe は trigger 成立後の plan amendment と design re-approval まで延期する。
- **Implementation**: template と offline repository test を RED から作り、registry 判定は fetch/time injection 可能な module に分離し、registry 外 trigger は index の待機表で追跡する。
- **Benefits**: scope を守りながら、失敗を含む再現可能な証拠、明確な task ownership、将来 lane の共通入口を得られる。
- **Evidence**: `7cd7516`、12 files / 114 tests、95.17% statement coverage、20/20 traceability、最終 VDD APPROVE。
- Saved to: `.sdd/patterns/contract-first-event-gated-beta-validation.md`

## Learnings → Rules Mapping

| Learning | Candidate rule / steering update |
|---|---|
| 外部 trigger 待ちの feature は contract、trigger、probe を分離すると speculative implementation を防げる | `.sdd/steering/tech.md` の beta-lane section に pattern への参照を追加する候補。まず次の 1 lane で再利用してから更新する |
| repository-wide assertion の RED は、diagnostic ごとの所有 task を記録しないと defect と区別できない | task template に「intentional RED の owner と解除 task」を記録する欄を追加する候補 |
| `next typegen` と `next build` は同じ `.next` を使うため並列 gate に向かない | Next.js gate は shared output directory を使う command 同士を直列実行する。既存の `mise run gate` 候補でも順序を固定する |
| build workaround は base と current を同じ条件で検証して初めて環境要因と判断できる | environment-specific failure を既存問題と扱う場合の base/current parity checklist に追加する |
| `pdca/plan.md` がないと Check の期待値復元が必要になる | `/sdd-plan` または `/sdd-impl` 開始時に PDCA plan artifact の存在を gate する |

## Process Improvements

### New Quality Gates

#### Gate: Intentional RED Ownership

**Phase**: 複数 task にまたがる contract-first implementation の各 task 終了時。

- [ ] failure diagnostic が現在 task の defect か downstream task の予定不足かを分類する。
- [ ] downstream-owned failure には解除する task ID と対象 file を記録する。
- [ ] repository suite が GREEN になるまで先行 task の完了 checkbox を保留する。

#### Gate: Shared Next.js Output Serialization

**Phase**: quality verification。

- [ ] `next typegen`、`next build`、その他 `.next` を変更する command を並列実行しない。
- [ ] environment-specific build failure は base/current を同じ command、dependency、execution location で比較する。
- [ ] workaround は source または build config を変更せず、標準の `mise run build` task を維持する。

### Tool/Template Updates

- **PDCA template**: `pdca/plan.md` の生成または存在確認を `/sdd-plan` と `/sdd-impl` の handoff に追加する。
- **Task template**: intentional RED を許す場合の owner、解除 task、completion hold を記録する欄を追加する。
- **Gate task**: constitution の deferred item どおり、lint → typecheck → test → build を直列実行する `mise run gate` を別 tooling change で検討する。

## Next Actions

### Immediate

- [ ] 本 reflection の `check.md`、`act.md`、success pattern を review し、必要なら checkpoint commit にする — repository owner。
- [ ] dependency update candidates は本 feature に混ぜず、専用 dependency change で評価する — repository owner。

### Triggered Follow-up

- [ ] ハブに Agent UI source が着地したら、対象 commit と import closure を固定し、DES-6.1 の amendment と design re-approval を行う。
- [ ] `openapi-typescript` が TS 7 対応候補を示したら、2 snapshots の byte comparison probe を task 化する。
- [ ] 2026-10-28 以降、公式 metadata で Node 26 Active LTS を確認してから hub-equivalent probe を task 化する。
- [ ] 対応 stable 公開から 24 時間経過後、prerelease と stable を隔離比較し、差分の有無にかかわらず record を残す。

### Validation of the Pattern

- [ ] 次に発火した beta lane でこの pattern を適用する。
- [ ] 2 回目の適用後、task handoff の rework、false-green finding 数、gate retry 数を比較する。
- [ ] 再利用性が確認できたら `.sdd/steering/tech.md` と共通 template への昇格を提案する。
