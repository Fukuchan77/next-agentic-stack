<!--
SYNC IMPACT REPORT
Version Change: N/A → 1.0.0
Modified Principles:
  - None (initial ratification)
Added Sections:
  - Core Principles (six principles)
  - Additional Constraints
  - Governance
Removed Sections:
  - None
Templates Status:
  ✅ ~/.claude/sdd/templates/specs/spec.md - reviewed; no change required
  ✅ ~/.claude/sdd/templates/specs/plan.md - constitution compliance table already present
  ⚠️ ~/.claude/sdd/templates/specs/tasks.md - generic constitution traceability is absent
  ⚠️ ~/.agents/skills/sdd-tasks/SKILL.md - constitution loading is not explicit
  ✅ AGENTS.md - governance authority and review timing added
  ✅ README.md - authoritative constitution link added
Deferred Items:
  - Review the global tasks template and `sdd-tasks` skill in a separate,
    cross-project change; project-specific principles must not be hardcoded there.
  - Resolved 2026-10-04: `mise run gate` added in a separate tooling change; Principle 5's
    "run `mise run gate` when it exists" clause now applies.
-->

# Next Agentic Stack Constitution

## Core Principles

### 1. 軽量スターターとしての責務分離

- 本リポジトリは、Next.js App Router と Vercel AI SDK による小さく理解可能な
  AI エージェントスターターであり続けなければならない（MUST）。
- 認証、RBAC、耐久ワークフロー、承認フロー、RAG、Python API レーンなど、
  統合ハブ `vaz-agentic-ai-next` が所有する本番相当機能を複製してはならない（MUST NOT）。
- 新しい機能または依存関係は、スターターの基礎能力かベータ検証レーンの目的に直接必要であると
  仕様または計画で説明しなければならない（MUST）。
- ハブ由来の部品を検証する場合、その正本はハブに置き、本リポジトリで独自拡張してはならない
  （MUST NOT）。

この境界により、スターターの可読性を保ち、ハブとの二重実装や責務の分岐を防ぐ。

### 2. 証拠に基づく先行検証

- プレリリース技術またはハブ候補変更の検証は、対象バージョン、対象コミット、再現手順、
  実行したゲート、結果、未解決事項を記録しなければならない（MUST）。
- ベータ検証記録は `docs/beta-lane/YYYY-MM-DD-<topic>.md` に一検証一ファイルで置き、
  ハブのどの据え置き理由を解消するか、結論が解消・部分解消・未解消のどれかを明記しなければ
  ならない（MUST）。
- ハブへ移送するのは再現可能な手順と証拠であり、設定ファイルを丸ごとコピーしてはならない
  （MUST NOT）。
- 失敗または互換性問題も検証成果として保存し、成功例だけを選択的に報告してはならない
  （MUST NOT）。

先行版を試す価値は「動いた」という主張ではなく、ハブが安全に判断できる再現可能な証拠にある。

### 3. 型安全なサーバーファースト設計

- TypeScript の `strict` 設定を維持し、公開境界で型安全性を弱める `any`、根拠のない型アサーション、
  未検証の外部入力を導入してはならない（MUST NOT）。
- React Server Components を既定とし、`"use client"` はブラウザ状態または対話性が必要な末端に
  限定しなければならない（MUST）。
- リクエスト、環境変数、ツール入力などの外部入力はサーバー境界で検証しなければならない
  （MUST）。
- Zod とサーバー専用モジュールをクライアントの値 import 経由でバンドルしてはならない
  （MUST NOT）。共有するクライアント定義は Zod 非依存でなければならない（MUST）。
- AI モデル ID は `src/lib/ai/model-allowlist.ts` に集約し、他の実装へ重複してハードコードしては
  ならない（MUST NOT、テスト fixture を除く）。

明確なサーバー・クライアント境界と一貫した型情報は、最新ツールチェーンの破壊的変更を早期に
検出し、クライアントバンドルの肥大化を防ぐ。

### 4. 決定論的で隔離された検証

- 時刻などの非決定的依存は注入可能にし、ツールまたはレート制御で `new Date()` を直接呼んでは
  ならない（MUST NOT）。テストでは固定値を注入しなければならない（MUST）。
- 単体テストと E2E テストは実 LLM を呼び出してはならない（MUST NOT）。単体テストは
  `ai/test` のモデル、E2E はネットワーク境界の UI Message Stream を使用しなければならない
  （MUST）。
- 重要な動作は API キーや外部サービスなしで CI 上に再現できなければならない（MUST）。
- 不具合修正と観測可能な挙動変更には、その失敗を再現し、修正前に失敗するテストを追加しなければ
  ならない（MUST）。既存テストが十分な場合は、その対応関係を変更説明に記録しなければならない。

決定論的なテストは、外部サービスの変動とプレリリース版そのものの回帰を区別可能にする。

### 5. 自動化された品質ゲートと予算

- コマンドは `mise.toml` を正とし、定義済みタスクは `mise run <task>` で実行しなければならない
  （MUST）。
- 変更完了前に `mise run gate` が存在する場合はそれを実行しなければならない（MUST）。存在しない
  現状では、少なくとも `mise run lint`、`mise run typecheck`、`mise run test:run`、
  `mise run build` を実行しなければならない（MUST）。
- UI フロー、ブラウザ動作、ビルド成果物、またはクライアント資産を変更した場合は、該当する
  `mise run test:e2e` と `mise run size` も実行しなければならない（MUST）。
- Client JS 240 kB、Client CSS 6 kB（いずれも brotli）の予算を維持し、緩和には計測結果と
  承認済みの仕様または計画変更を要求する（MUST）。
- ゲート失敗を既存問題として扱う場合は、ベースブランチでも同じ失敗が再現する証拠を示さなければ
  ならない（MUST）。

一つの再現可能な検証経路と定量的予算により、品質低下を主観ではなく自動判定で阻止する。

### 6. 再現可能で安全な依存管理

- Node.js、pnpm、およびプレリリース依存はリポジトリの方針どおり固定し、TypeScript nightly、
  Next.js canary、Playwright alpha をバージョン範囲へ変更してはならない（MUST NOT）。
- 依存更新の検討前に `mise run outdated` を実行し、`minimumReleaseAge` の 24 時間を満たす版だけを
  採用しなければならない（MUST）。
- 新規依存は承認済みの計画に記載し、標準ライブラリまたは既存依存で代替できない理由を示さなければ
  ならない（MUST）。
- install/postinstall スクリプトは既定で遮断し、必要性を確認したパッケージだけを `allowBuilds` へ
  明示的に追加しなければならない（MUST）。
- CI は frozen lockfile、脆弱性監査、全履歴の gitleaks スキャンを維持しなければならない
  （MUST）。シークレットスキャンに `gitleaks dir` を使用してはならない（MUST NOT）。

ベータ版を積極的に試すリポジトリほど、バージョンの再現性とサプライチェーン防御を強く保つ必要が
ある。

## Additional Constraints

- 仕様、計画、タスク、constitution、検証記録は `spec.json` の対象言語に従う。現在の対象言語は
  日本語である。コード識別子とコードコメントは英語でなければならない（MUST）。
- Next.js のコードまたは規約を変更する前に、インストール済み
  `node_modules/next/dist/docs/` の該当ガイドを確認しなければならない（MUST）。
- UI は shadcn/ui（new-york）と Tailwind CSS v4 を標準とする。単純な選択 UI はラベル関連付けと
  E2E 操作性を保つため、`NativeSelect` を優先しなければならない（MUST）。
- `/api/chat` の防御順序は rate limit、body size、strict request schema を維持し、モデル呼び出し前に
  拒否しなければならない（MUST）。件数、文字数、バイト数、レート、エージェント反復回数には
  明示的な上限がなければならない（MUST）。
- SDD は requirements、design、tasks の順に進め、requirements は人間の承認なしに後続段階へ進めては
  ならない（MUST NOT）。各 design と tasks は本 constitution の全 MUST 規則への適合を示さなければ
  ならない（MUST）。

## Governance

- **Authority**: 本 constitution はプロジェクト内の場当たり的な判断より優先される。仕様、計画、
  タスク、実装、レビューが矛盾する場合は constitution に従う。例外には理由、範囲、期限、承認者を
  文書化しなければならない（MUST）。
- **Amendment procedure**: 変更案は、変更理由、影響する原則・成果物、移行手順、提案するバージョン
  増分を示す。レビューと承認後に constitution、Sync Impact Report、影響するテンプレートまたは
  文書を同一変更で更新する（MUST）。
- **Versioning policy** (semantic):
  - MAJOR: 原則の削除、意味の反転、既存遵守方法を無効にする再定義。
  - MINOR: 新しい原則・節の追加、または遵守範囲の実質的な拡張。
  - PATCH: 意味を変えない明確化、誤字修正、非意味的な表現改善。
- **Compliance review**: `/sdd-plan` は各 MUST 原則の適合表を作成し、`/sdd-analyze` とコードレビューは
  違反を重大問題として扱う。変更完了時には適用可能な品質ゲートの結果を記録しなければならない
  （MUST）。
- **Review cadence**: constitution は、プレリリース技術の安定版移行、ハブとの責務変更、品質予算の
  変更、または新しい SDD feature の計画開始時に再確認しなければならない（MUST）。

**Version**: 1.0.0 |
**Ratified**: 2026-10-03 |
**Last amended**: 2026-10-03
