# Contract-first Event-gated Beta Validation

## Problem

プレリリース技術の検証では、外部 release、上流 repository の変更、LTS 昇格など、今すぐ成立しない条件が多い。trigger 前に probe を実装すると、推測した source や版に依存する過剰実装になりやすい。一方で trigger を待つだけでは、記録形式、判定基準、再現手順が検証ごとにばらつき、成功例だけを選択する危険がある。

## Solution

検証レーンを次の三層に分離する。

1. **Contract layer**: trigger に依存しない記録 schema、索引、三値判定、gate evidence、対象 commit、未解決事項を先に固定する。
2. **Trigger layer**: registry で決定できる条件は注入可能な reporter で通知し、registry 外の条件は確認方法と最終確認日を持つ待機表で追跡する。
3. **Probe layer**: trigger 成立後にだけ plan amendment、design re-approval、task generation を行い、scratch workspace で隔離検証する。

repository test は contract と実 record の双方を検査し、event-gated lane には「何をまだ実装してはいけないか」も明記する。

## Implementation

1. 検証 record の template に固定メタデータ、必須見出し、command/result pair、三値判定を定義する。
2. repository test を先に RED にし、既存 record、index、README/pin 同期の不足を diagnostics として列挙する。
3. 外部取得を行う reporter は、取得関数と時刻を注入できる純粋な判定 module に分離する。
4. 自動判定できない trigger は、確認元、発火条件、最終確認日を index に置く。
5. downstream task が不足を埋めるまで先行 contract task を完了扱いにせず、最後に統合 GREEN を確認する。
6. probe の source や dependency は trigger 後の承認済み amendment で初めて追加する。

## Benefits

- **Evidence quality**: 成功・失敗のどちらも同じ contract で保存され、対象 commit と未解決事項を追跡できる。
- **Scope control**: trigger 前の speculative implementation とハブ正本の複製を防ぐ。
- **Determinism**: 日常 CI は offline repository test と fake registry response で再現できる。
- **Maintainability**: 新しい検証 lane は template、trigger、probe task の順に追加でき、既存 lane と同じ判断経路を再利用できる。
- **Reviewability**: RED diagnostics の所有 task が明確になり、意図的 RED と defect を区別できる。

## Evidence

- `specs/001-hub-beta-lane/traceability.md`: 20/20 requirements に design、task、test、commit link。
- `specs/001-hub-beta-lane/pdca/do.md`: 2 suite の RED/PROVE、5 review cycle、最終 APPROVE を記録。
- `tests/repo/beta-lane.spec.ts`: record、index、template、pin/channel の offline contract test。
- `tests/repo/check-updates.spec.ts`: fake registry と固定時刻による trigger reporter test。
- Final gate: 12 files / 114 tests passed、全 source 95.17% statements / 99.25% lines。
- Implementation: `7cd7516 feat(beta-lane): formalize hub verification workflow`。

## Applicability

- Reusability: **High**
- Apply when: adoption depends on a future release, upstream merge, LTS state, or another externally observable trigger.
- Do not treat entry-contract completion as probe completion; each triggered probe still requires its own evidence record and quality gates.
