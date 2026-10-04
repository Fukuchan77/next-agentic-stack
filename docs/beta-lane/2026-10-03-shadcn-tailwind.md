# 検証記録: shadcn/ui + Tailwind CSS v4(2026-10-03)
- 対象ハブコミット: 不明（遡及補正）
- 検証したコミット: `479bd2a`
- 対象の据え置き: ADR-0008 エージェント UI の shadcn/ui + Tailwind CSS 移行に対するベータレーン互換性証拠の不足
- 判定: 部分解消
- 未解決事項: 対象ハブコミット不在、Carbon 共存時の preflight 方針、Firefox 未実行

ハブ(`vaz-agentic-ai-next`)の ADR-0008(エージェント UI は shadcn/ui + Tailwind)に向けた、
TypeScript ベータレーンでのスパイク。ハブの `docs/dependency-policy.md` §8.2-1 の
「ベータレーン側の記録」にあたる。

## 結論

判定は **部分解消**。ADR-0008 の採用障害のうち、shadcn/ui + Tailwind CSS v4 が starter の
Next canary / TypeScript nightly とハブ相当の安定版構成で build・test・size 予算を通ることは確認できた。
一方、この検証はハブ source や特定のハブコミットを対象にしておらず、Carbon 共存時の preflight 方針と
Firefox の実行も残るため、ADR-0008 の移行障害を完全には解消していない。

- **Tailwind v4 は `@tailwindcss/postcss` 経由で Turbopack のビルドに組み込める。** 追加の Next 設定は不要で、
  `postcss.config.mjs` だけで動いた。Next 16.4 canary と、ハブと同じ Next 16.3.8 安定版の両方で確認した。
- **ハブと同じ版の組み合わせ(Node 24 / Next 16.3.8 / TypeScript 6.0.3)でも同じソースが通る。**
  shadcn の部品はソースのコピーなので、TS 7 nightly と TS 6 の差は出なかった。
- **CSS は固定費が半分以上。** brotli 後 3.89 kB のうち、preflight とテーマ変数が 約 2.2 kB、
  ユーティリティ(今回の 4 部品と画面)が 約 1.9 kB。starter の上限 4 kB では余裕が 0.1 kB しかなく、
  部品を 1 つ足すと超えるため、6 kB に上げた。ハブの上限 22 kB には十分収まる。
- **`allowBuilds` の追加は不要だった。** `pnpm install` / `pnpm ignored-builds` で、新しい依存に
  install スクリプトを持つものは無かった(`@tailwindcss/oxide` はビルド済みバイナリの optional 依存)。

## 検証した版

- 検証した starter commit: `479bd2a`（2026-10-03 04:31 UTC）
- prerelease 構成: Node.js `26.10.0`、pnpm `12.6.0`、Next.js `16.4.0-canary.56`、
  React / React DOM `19.3.0`、TypeScript `7.1.0-dev.20261001.1`（nightly）、Tailwind CSS
  `4.3.3`、`@tailwindcss/postcss` `4.3.3`
- UI dependency: `radix-ui` `1.6.7`、`class-variance-authority` `0.7.1`、`clsx` `2.1.1`、
  `tailwind-merge` `3.7.0`、`lucide-react` `1.49.0`
- ハブ相当として記録した安定版構成: Node.js `24.21.0`、Next.js `16.3.8`、TypeScript `6.0.3`

この記録はハブ source の検証ではなく、ハブと同じ版の組み合わせで starter を検証したものである。
`479bd2a` の記録時点で、ハブ `main` の `apps/web` は `next ^16.3.7`（`04d6d83`）だった。
`next ^16.3.8` が入った `834f6f3` は同日 06:43 UTC で、記録時刻 04:31 UTC より後である。
したがって、記録時点に版の組み合わせが一致するハブコミットは存在せず、後から推定せずに
`対象ハブコミット: 不明（遡及補正）` とした。

## 変更内容

- `src/sections/chat/Chat.tsx` / `src/sections/users/UserCard.tsx` / `src/app/page.tsx` を CSS Modules から
  Tailwind のユーティリティと shadcn/ui の部品(`Button` / `Input` / `NativeSelect` / `Card`)に移した。
  `*.module.css` は残っていない。
- プロバイダ選択は Radix の `Select` ではなく shadcn の `NativeSelect`(ネイティブ `<select>`)にした。
  ラベルとの関連付けと Playwright の `selectOption` がそのまま動き、E2E を書き換えずに済む。
- `globals.css` は `@import "tailwindcss" source("../")` で走査対象を `src/` に限定した。
  既定の自動検出は `README.md` や `docs/` も読み、そこに出てくる語のユーティリティまで出力する
  (限定前 3.97 kB → 限定後 3.89 kB)。
- ダークモードは shadcn 既定の `.dark` クラスではなく、Tailwind v4 既定の `prefers-color-scheme` に合わせた
  (従来の CSS Modules 版と同じ挙動)。
- Dependabot に `ui` グループを追加した(`radix-ui` / `class-variance-authority` / `clsx` /
  `tailwind-merge` / `lucide-react`)。`tailwindcss` / `@tailwindcss/postcss` は devDependency なので
  既存の `dev-tooling` グループに入る。
- 依存の版は `from-genai-to-agentic-ai` の `001-agentic-ai-platform` ブランチと揃えた(caret 指定)。
  `lucide-react` だけは 1.49.0 になった(1.50.0 は `minimumReleaseAge` の 24 時間を満たさなかった)。
- shadcn の CLI は使っていない(実行環境から `ui.shadcn.com` に接続できなかった)。部品は new-york v4 の
  ソースを手で写し、`components.json` を置いたので、以後は `pnpm dlx shadcn add` が使える。

## 計測

`mise run size`(brotli)。

| 構成 | Client JS | Client CSS |
| --- | --- | --- |
| 変更前(`main`@`1ae3fbd`、CSS Modules) | 221.13 kB | 0.83 kB |
| 変更後(Node 26.10 / Next 16.4.0-canary.56 / TS 7.1 nightly) | 231.53 kB | 3.89 kB |
| 変更後をハブの版で(Node 24.21 / Next 16.3.8 / TS 6.0.3) | 230.17 kB | 3.89 kB |

JS の増分 約 10 kB は `tailwind-merge` / `clsx` / `class-variance-authority` / Radix `Slot` / lucide のアイコン。

## 通したゲート

両方の構成で次がすべて通った。

| コマンド | 結果 |
| --- | --- |
| `pnpm exec biome check .` | エラーなし(`tailwindDirectives` を有効化) |
| `pnpm typecheck`(`next typegen` + `tsc`) | 通過 |
| `pnpm exec vitest run` | 9 ファイル / 43 件 通過(テストの変更なし) |
| `pnpm build` | 通過 |
| `pnpm exec size-limit` | 通過(JS 240 kB / CSS 6 kB) |
| `pnpm audit` | 既知の脆弱性なし |
| `CI=1 pnpm exec playwright test`(Chromium のみ。canary 構成) | 2 件 通過(テストの変更なし) |

Firefox は実行環境に無く、CI に任せた。

## ハブへ持ち込むときの注意

- `radix-ui` は Radix の全プリミティブを束ねたパッケージで、ロックファイルに約 60 個の `@radix-ui/*` が入る。
  バンドルには使う部品しか入らない。ロックファイルの差分を小さくしたいなら、部品ごとの
  `@radix-ui/react-*` を指定する選択肢もある。
- ハブは Carbon と共存する期間があるため、preflight の扱いは移行計画レビューの提案(共存中は `tailwindcss/theme` と `tailwindcss/utilities` だけを読み込む)に従う。
  この記録は preflight ありの数字である。
- `source(...)` による走査範囲の限定は、ハブの `apps/web/src` にもそのまま当てはまる
  (指定しないと、リポジトリ直下からの自動検出で `docs/` や `specs/` まで読まれる)。

## 再現手順

まず、記録を含む commit と lockfile から prerelease 構成を再現する。

```bash
git switch --detach 479bd2a
mise install
pnpm install --frozen-lockfile
pnpm exec biome check .
pnpm typecheck
pnpm exec vitest run
pnpm build
pnpm exec size-limit
pnpm audit
CI=1 pnpm exec playwright test
```

期待結果は「通したゲート」表のとおりで、Vitest は 9 ファイル / 43 件、Chromium の Playwright は
2 件、Client JS は 231.53 kB、Client CSS は 3.89 kB で通過する。Firefox は当時の実行環境になく、
この手順のローカル結果には含まれない。

ハブ相当構成は clean な scratch copy で Node.js、Next.js、TypeScript だけを記録済みの版へ固定し、
同じ gate と size 計測を行う。

```bash
workdir="$(mktemp -d)"
git archive 479bd2a | tar -x -C "$workdir"
cd "$workdir"
mise exec node@24.21.0 -- pnpm install --frozen-lockfile
mise exec node@24.21.0 -- pnpm add --save-exact next@16.3.8 typescript@6.0.3
mise exec node@24.21.0 -- pnpm exec biome check .
mise exec node@24.21.0 -- pnpm typecheck
mise exec node@24.21.0 -- pnpm exec vitest run
mise exec node@24.21.0 -- pnpm build
mise exec node@24.21.0 -- pnpm exec size-limit
```

期待結果は Client JS 230.17 kB、Client CSS 3.89 kB、および各 gate の通過である。後半は
`479bd2a` の lockfile に対して version pin を置き換えるため、将来再実行した場合は registry 上の
transitive dependency の解決差が生じ得る。比較時は実際に解決した lockfile も証拠として保存する。
