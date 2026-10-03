# Structure

この文書は、コードをどこへ置き、どの方向へ依存させるかを記録する。個別ファイルの一覧ではなく、
新しいコードにも適用できる組織パターンを示す。

## Organization Pattern

App Router の薄いアプリケーション shell、ドメイン別 section、共有 UI、横断 library を分離する。
ページと route は構成と framework 接続に集中し、テスト可能な処理は section または `lib` の
関数・factory へ移す。

例:

```text
src/
  app/                  # route、layout、page、global style
  sections/chat/        # chat ドメインの UI
  components/ui/        # 再利用する shadcn/ui primitives
  lib/ai/               # AI の server boundary と共有契約
```

新しい product domain は `src/sections/<domain>/` が UI と server data access を所有する。
複数 domain が共有する純粋な仕組みだけを `src/lib/` に昇格させる。

## Directory Map (high level)

| Path | Holds |
|------|-------|
| `src/app/` | App Router の layout、page、route、global CSS。処理本体は持たない |
| `src/sections/<domain>/` | ドメイン単位の component と server-side data access |
| `src/components/ui/` | ドメイン非依存の UI primitives。コピー済み shadcn/ui を含む |
| `src/lib/` | clock、rate limit、class helper などの横断的で UI 非依存な処理 |
| `src/lib/ai/` | provider、env、registry、agent、tool、chat request/handler、limit |
| `tests/` | source の公開振る舞いを検証する Vitest tests と共有 test helpers |
| `tests/e2e/` | ブラウザから見える主要 user flow の Playwright tests |
| `docs/beta-lane/` | ベータ検証ごとの再現手順、結果、ハブへの移送判断 |
| `specs/<feature>/` | feature ごとの requirements と承認 metadata |

## Naming Conventions

- React component とそのファイルは PascalCase: `Chat.tsx`、`UserCard.tsx`。
- data access は動詞で始まる camelCase: `getUsers.ts` / `getUsers()`。
- factory は `create`、判定関数は `is`、解析関数は `parse` を接頭辞に使う。
- framework 非依存の utility file は用途を表す lowercase または kebab-case:
  `clock.ts`、`rate-limit.ts`。
- test file は対象の振る舞い名に `.spec.ts` または `.spec.tsx` を付ける。
- 定数は `UPPER_SNAKE_CASE`、型・interface は PascalCase、値と関数は camelCase。

## Import / Dependency Rules

- project 内 import は原則として `@/` alias を使い、同一小規模 module 内だけ相対 import を許容する。
- type-only dependency は `import type` を使い、不要な runtime edge を作らない。
- `src/app/` は `sections` と `lib` を構成できるが、domain logic を内包しない。
- `sections` は `components/ui` と client-safe な `lib` を利用できる。別 section の内部実装へ直接
  依存せず、共有が必要なら契約を `lib` へ昇格させる。
- client component は `env.ts`、`registry.ts`、`agent.ts` などの server-only module を値として
  import しない。必要な UI message は type import に限定する。
- client と server の両方が読む module は Zod、Node-only API、秘密情報への参照を含めない。
- test は公開 interface または factory を通して検証し、route file の制約を回避する実装詳細を
  route file へ export しない。

## Where Things Go

- 新しい product feature → `src/sections/<domain>/`。page はその公開 component/data function を構成する。
- 新しい App Router endpoint → `src/app/api/<name>/route.ts`。検証可能な handler は
  `src/lib/<domain>/` または該当 section の server module に置く。
- 新しい AI provider または model policy → provider 定義、allowlist、registry の既存境界を更新し、
  client-safe 定義と server-only 解決を分離する。
- 新しい agent tool → `src/lib/ai/tools.ts` または規模に応じた `src/lib/ai/tools/`。入力 schema と
  注入可能な外部依存を持たせる。
- 新しい共有 UI primitive → `src/components/ui/`。product 固有の組み合わせは section に置く。
- 新しい横断 utility → 複数 domain で再利用され、UI に依存しない場合だけ `src/lib/` に置く。
- 単体・component・route test → `tests/<behavior>.spec.ts(x)`。共通 model fixture は
  `tests/helpers/` に置く。
- browser user flow → `tests/e2e/<flow>.spec.ts`。外部 LLM は `page.route` で置き換える。
- ベータ検証の証拠 → `docs/beta-lane/YYYY-MM-DD-<topic>.md`。コード規約そのものは steering に残す。
