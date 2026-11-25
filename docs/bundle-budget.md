# クライアントバンドル予算の変更記録

`size-limit`(`package.json`)がクライアント JS / CSS(brotli)の上限を CI の `bundle-size` job で検査する。
上限の変更は、実測値をこの表に残すレビュー済みの変更として行う。

| 日付 | クライアント JS 上限 | 実測 | 理由 | 承認 |
| --- | --- | --- | --- | --- |
| 2026-11-25 | 240 kB → 245 kB | 241.65 kB(`ai` 7.0.181 / `@ai-sdk/react` 4.0.186) | `ai` と `@ai-sdk/react` の最新版でクライアント JS が 2.34 kB 増え(239.31 kB → 241.65 kB)、240 kB を超えた。最新へ追従するため、実測に約 3.3 kB の余裕を持たせて引き上げる | `Fukuchan77` |

## 測定の手順

`NODE_ENV=production pnpm exec next build` のあとに `pnpm run size` を実行する。同じ依存で `ai` 7.0.172 / `@ai-sdk/react` 4.0.176 に戻すと 239.31 kB、`main`(据え置き前)は 238.87 kB だった。
