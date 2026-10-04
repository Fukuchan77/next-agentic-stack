# 検証記録: TypeScript 7 と compiler API 依存ツール(2026-10-03)
- 対象ハブコミット: `1a08a97`
- 検証したコミット: `cb5f86e`
- 対象の据え置き: docs/dependency-policy.md §8.1 typescript 6.x — TS 7 のネイティブ移植では JS の compiler API が package root にない
- 判定: 部分解消
- 未解決事項: `openapi-typescript` の TS 7 対応版で 2 snapshot の生成結果が byte 単位で一致するまで、codegen の TypeScript 6 隔離を外せない

ハブ(`vaz-agentic-ai-next`)の `docs/dependency-policy.md` §8.1 が `typescript` 6.x を据え置く理由
「TS 7 はネイティブ移植で、JS の compiler API が無い」について、ハブが使う compiler API 依存のツール
(`openapi-typescript`、`next typegen`)が TS 7 下で通るかを確かめた。§8.2-1 の「ベータレーン側の記録」にあたる。

どちらのリポジトリの依存も変更していない(ハブ相当の構成はスクラッチのコピーで組んだ)。

## 結論

- **障害は半分だけ解消している。** Next.js 側は TS 7 で通る。`openapi-typescript` は TS 7 では動かない。
- **`next typegen` と `next build` の型検査は、ハブと同じ Next 16.3.7 安定版 + TS 7.0.2 安定版で通る。**
  `next build` の型検査は形だけでなく実際に動いており、わざと入れた型エラーで `Failed to type check.` になる。
- **`openapi-typescript` 7.13.0(最新)は TS 7 では起動時に落ちる。** TS 7 の `typescript` パッケージの
  ルート export は `version` しか持たず(compiler API は `typescript/unstable/*` に移った)、
  `ts.factory` が `undefined` になる。上流に TS 7 対応版はまだ無い(peer は `typescript@^5.x` のまま)。
- **回避策はある。** コード生成だけを、TS 6 を持つワークスペースパッケージに閉じ込めればよい。
  ルートは TS 7 のまま、ハブの 2 つのスナップショットから生成した型は、コミット済みのファイルと
  **バイト単位で同一**になり、その出力は TS 7 の `tsc --strict` も通る。
- ハブに取り込む場合は、TS 7 の PR の中でこの回避策も入れる必要がある(下記「ハブへ持ち込むときの手順案」)。
  TS 7 安定版(7.0.2)があるので、§8.2-3(プレリリース版は入れない)には抵触しない。

## 検証した版

| 項目 | 版 |
| --- | --- |
| TypeScript | 7.0.2(安定版、npm の `latest`)/ 7.1.0-dev.20261001.1(本リポジトリの nightly) |
| Next.js | 16.3.7(ハブのロックファイルの版)/ 16.4.0-canary.57(本リポジトリ) |
| openapi-typescript | 7.13.0(ハブのロックファイルの版。npm の `latest`) |
| Node.js | 24.21.0(ハブの `node = "24"`)/ 26.10.0(本リポジトリ) |
| pnpm | 12.6.0 |

## 通したゲート

失敗した command も含め、実行した command と result を対応付ける。構成ごとの差分と失敗内容は
後続の詳細に残す。

| Command | Result |
| --- | --- |
| `pnpm typecheck` | 4 構成で通過。`next typegen` と `tsc` 2 件が成功した |
| `pnpm build` | 4 構成で通過。Next 16.3.7 / TS 7.0.2 のハブ相当構成を含め、型検査も成功した |
| `pnpm build`（`src/lib/clock.ts` に意図的な型エラーを追加） | 期待どおり失敗。TS2322 と `Failed to type check.` を確認した |
| `pnpm exec openapi-typescript <hub>/packages/schemas/src/generated/openapi.snapshot.json -o out.ts`（TS 7 のみ） | 起動時に失敗。`ts.factory` が `undefined` で `createKeywordTypeNode` を読めなかった |
| `pnpm --filter codegen exec openapi-typescript <hub>/packages/schemas/src/generated/openapi.snapshot.json -o "$PWD/a.ts"`（codegen package に TS 6.0.3 を隔離） | 通過。2 snapshot から生成できた |
| `diff a.ts <hub>/packages/schemas/src/generated/agent-service.ts`（API service 側も同様に比較） | 通過。生成した 2 ファイルはハブのコミット済みファイルと byte 単位で同一だった |
| `pnpm exec tsc --noEmit --strict`（生成した 2 ファイルを TS 7 で検査） | 通過。ハブの `apps/web` が TS 7 で生成型を読む経路に問題はなかった |

### Next.js(`next typegen` / `next build`)

本リポジトリのソースを、Next だけハブの版に差し替えたコピーで実行した。

| 構成 | `pnpm typecheck`(`next typegen` + `tsc` ×2) | `next build`(型検査を含む) |
| --- | --- | --- |
| Node 26.10 / Next 16.4.0-canary.57 / TS 7.1 nightly(本リポジトリそのまま) | 通過 | 通過 |
| Node 26.10 / Next 16.3.7 / TS 7.1 nightly | 通過 | 通過 |
| Node 26.10 / Next 16.3.7 / TS 7.0.2 | 通過 | 通過 |
| Node 24.21 / Next 16.3.7 / TS 7.0.2(ハブに入れる組み合わせ) | 通過 | 通過 |

型エラーを 1 行足した状態の `next build`(Next 16.3.7 / TS 7.1 nightly)は、次で止まった。

```text
src/lib/clock.ts(6,14): error TS2322: Type 'string' is not assignable to type 'number'.
Failed to type check.
```

Next 16.4 canary には、TS 7 の `tsc` を子プロセスとして起動する経路(`dist/lib/typescript/runTypeScriptCli.js`)が
入っている。16.3.7 でも型検査が通ったので、ハブは Next を canary に上げなくてよい。

### openapi-typescript

入力はハブの `packages/schemas/src/generated/` にある 2 つのスナップショット
(`openapi.snapshot.json` / `api-service.openapi.snapshot.json`)。

| 構成 | 結果 |
| --- | --- |
| ルートに TS 7(7.0.2 / 7.1 nightly とも)だけを置く | 起動時に失敗(下記) |
| 同上 + `pnpm.overrides` で `openapi-typescript>typescript` を `6.0.3` に向ける | 同じく失敗。peer 依存は overrides で付け替わらない |
| ルートは TS 7、`openapi-typescript` と `typescript@6.0.3` を別のワークスペースパッケージの devDependencies に置く | 通過。2 ファイルともハブのコミット済み `agent-service.ts` / `api-service.ts` と同一 |

TS 7 だけのときの失敗:

```text
.../openapi-typescript/dist/lib/ts.mjs:11
const BOOLEAN = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
                           ^
TypeError: Cannot read properties of undefined (reading 'createKeywordTypeNode')
```

生成された 2 ファイルは、ルートの TS 7 で `tsc --noEmit --strict` を通った。
ハブの `apps/web` が TS 7 でこれらの型を読み込んでも問題ないことの確認になる。

### その他のハブ側の TypeScript 利用

- ハブのロックファイルで `typescript` を peer に取るのは `openapi-typescript` と `inngest` の 2 つだけ。
  `inngest` 4.21.0 の `typescript` peer は optional(`peerDependenciesMeta`)で、ソースから `typescript` を
  import していない。
- ハブのリポジトリ内で `typescript` を import しているソースは無い。
- `@vaz/evals` の `typecheck` が使う `tsc --ignoreConfig` は、TS 7.0.2 でも受け付けられる。

## ハブへ持ち込むときの手順案

§8.2-2 の「1 メジャーにつき 1 PR」の中身として、次を想定している。ハブ自身のゲート(`mise run check`、`size`)で確認すること。

1. `openapi-typescript` と `typescript@6.0.3` を、ルートではなく `packages/schemas` の devDependencies に移す。
   生成物の置き場(`packages/schemas/src/generated/`)と同じパッケージなので、移す先として自然。
2. `mise.toml` の `openapi:gen` の `pnpm exec openapi-typescript …` を
   `pnpm --filter @vaz/schemas exec openapi-typescript …` に変え、パスをパッケージ基準に直す。
3. 再生成して差分が出ないこと(`git diff --exit-code packages/schemas/src/generated`)を確認する。
4. ルートの `typescript` を `^7.0.2` に上げ、§8.2-2 の残り(`dependabot.yml` の `ignore`、
   `tests/repo/dependabot.spec.ts` の `HELD_BACK`、`CLAUDE.md` / `AGENTS.md`、§8.1 の表)をまとめて更新する。
5. `openapi-typescript` が TS 7 に対応した版を出したら、`packages/schemas` の TS 6 を外す。それまでは
   `packages/schemas` の TS 6 を Dependabot の `ignore` で 6.x に留める。

`@types/node` の据え置き(§8.1 の 2 行目)はこの検証の対象外。Node ランタイムを上げる判断が先、という
ハブの方針どおり、今回の検証はすべて `@types/node` を各リポジトリの版のまま行った。

## 再現手順

```bash
# 1) openapi-typescript を TS 7 だけで動かす(失敗する)
mkdir probe && cd probe
echo '{"private":true,"devDependencies":{"openapi-typescript":"7.13.0","typescript":"7.0.2"}}' > package.json
pnpm install
pnpm exec openapi-typescript <hub>/packages/schemas/src/generated/openapi.snapshot.json -o out.ts

# 2) ワークスペースで TS 6 に閉じ込める(通る)
mkdir -p ws/codegen && cd ws
echo '{"private":true,"devDependencies":{"typescript":"7.0.2"}}' > package.json
printf 'packages:\n  - codegen\n' > pnpm-workspace.yaml
echo '{"name":"codegen","private":true,"devDependencies":{"openapi-typescript":"7.13.0","typescript":"6.0.3"}}' > codegen/package.json
pnpm install
pnpm --filter codegen exec openapi-typescript <hub>/packages/schemas/src/generated/openapi.snapshot.json -o "$PWD/a.ts"
diff a.ts <hub>/packages/schemas/src/generated/agent-service.ts   # 差分なし

# 3) Next 16.3.7 + TS 7.0.2 で本リポジトリを型検査・ビルドする
git archive HEAD | tar x -C ../stable && cd ../stable
# package.json の next を 16.3.7、typescript を 7.0.2 に書き換える
pnpm install --no-frozen-lockfile && pnpm typecheck && pnpm build
```
