# AI Handoff

- Date: 2026-03-20
- Project: e-be
- Branch: main

## 作業概要
`packages/db` の初期実装を完了し、Drizzle ORM によるスキーマ定義とビジネスロジック（ステートマシン・プラン判定）を整備した。Issue #2 の主要な要件を満たし、`apps/web` から利用可能な状態にした。

## 完了済みタスク
- `packages/db` のディレクトリ構造と `package.json` / `tsconfig.json` セットアップ
- Drizzle ORM スキーマ実装 (`src/schema.ts`):
    - `users` / `organizations` / `organization_members` / `events` / `bar_host_permissions` / `bar_blocks` / `coupons` / `user_coupons` / `audit_logs` / `notifications`
    - `organization_members` における「1組織1人 owner」の制約を `uniqueIndex(...).where(...)` で実装
- イベントステートマシン・ロジック実装 (`src/event-transitions.ts`):
    - `resolveStatus()`: 時刻（`start_at`/`end_at`）から `ongoing`/`completed` を導出
    - `canTransition()`: ロールと許可状態に基づいたステータス遷移のバリデーション
- プラン制限ロジック実装 (`src/plans.ts`):
    - `canUseFeature()`: `free`/`premium` プランに応じた機能利用可否判定
- 通知タイプ定義 (`src/notification-types.ts`)
- `apps/web` への `@e-be/db` (workspace:*) 依存関係の追加
- `packages/db` のビルド確認（`tsup` による CJS/ESM/DTS 出力）
- 実装計画書作成 (`.claude/steering/db-schema.md`)
- コミット完了: `feat(db): packages/db を実装し Drizzle スキーマとユーティリティを定義 (Issue #2)`

## 未完了・継続タスク
- VitePress セットアップ (#1)
- Supabase 接続・認証設定 (#3)
- `apps/mobile` Expo セットアップ (#4)
- 参加表明の仕組み（TBD）・支払いフローの実装

## 重要な決定事項
- **Drizzle Partial Index**: `unique` ではなく `uniqueIndex().where()` を使うことで、論理削除や条件付きユニーク制約（role='owner'）を DB レベルで保証した
- **ビルド設定**: `tsup` を使い、`schema`, `plans`, `event-transitions`, `notification-types` をそれぞれ個別に import 可能な sub-path export 構成にした
- **ステートマシン**: 導出ステータス（`ongoing`/`completed`）をロジック層に集約し、DB には永続的な状態のみを持たせる方針を貫徹

## 次のセッションへの最初の指示
1. `docs/architecture/decisions.md` の #1〜#13 を再確認する
2. VitePress をセットアップし、`docs/*.md` をブラウザで閲覧可能にする (#1)
3. Supabase プロジェクトを作成し、`packages/db` を使ってマイグレーションを実行する (#3)
