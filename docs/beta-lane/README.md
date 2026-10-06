# Beta lane verification records

この directory は、統合ハブ `vaz-agentic-ai-next` の採用判断に渡すベータ検証記録を管理する。
新しい検証は [TEMPLATE.md](TEMPLATE.md) の contract に従い、成功・失敗・未解決事項を同じ形式で残す。

## 検証記録

| 日付 | トピック | 結論 | 取り込み先 | 記録 |
| --- | --- | --- | --- | --- |
| 2026-10-03 | shadcn/ui + Tailwind CSS v4 | ハブ相当の安定版と prerelease 構成で gate と CSS 予算を確認したが、ハブ source・Carbon 共存・Firefox は未検証のため部分解消 | hub spec `009` R1-R4 | [記録](2026-10-03-shadcn-tailwind.md) |
| 2026-10-03 | TypeScript 7 と compiler API | `next typegen` は通り、`openapi-typescript` は TS 6 を codegen package に隔離すれば同一生成物を得られるため部分解消 | hub spec `009` R5 | [記録](2026-10-03-ts7-compiler-api.md) |
| 2026-10-06 | エージェント UI 部品 | ハブ `e26f6fe` の 3 部品を無改変コピーし、プレリリース toolchain で Agent UI 行のゲートがすべて通ったため解消。starter の `card.tsx` に 3 export を追加 | hub spec `009` R2 | [記録](2026-10-06-agent-ui.md) |

## 待機中のトリガー

npm registry metadata で判定できる `openapi-typescript` の peer/dependency 候補、TypeScript 7.x
stable minor、pinned prerelease に対応する stable は `mise run outdated` の reporter が表示する。
次の三つは registry だけでは判定できないため、同 command の実行時に人が確認し、最終確認日を更新する。
発火しても直ちに実装せず、plan amendment と design re-approval を経て新しい task を作る。

| トリガー | 対応要件 | 確認方法 | 最終確認日 |
| --- | --- | --- | --- |
| `openapi-typescript` の TS 7 対応 release note | 3.1 | 上流の公式 release / changelog に TS 7 対応宣言があるか | 2026-10-03 |
| ハブへの agent-ui source の着地 | 2.1 | ハブ `main` に `apps/web/src/components/agent-ui/` があり、対象 commit と import closure を確定できるか(2026-10-04 に発火し、2026-10-06 の記録で検証済み。部品が更新されたら再確認する) | 2026-10-06 |
| Node 26 Active LTS | 4.1 | `https://nodejs.org/dist/index.json` の 26.x の `lts` 欄が Active LTS を示すか | 2026-10-03 |

- `openapi-typescript`: 公式 release / changelog に TypeScript 7 対応の明示があるまで待機する。
- Agent UI: 2026-10-04 に発火し、2026-10-06 に検証した。ハブの部品が更新されたら、同じく commit と import closure を確定してから再検証する。
- Node.js 26: 2026-10-28 より前、または公式 metadata が Active LTS を示す前には発火させない。
