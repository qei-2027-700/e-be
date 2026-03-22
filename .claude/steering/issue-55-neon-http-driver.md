# Issue #55: perf: DB ドライバーを postgres-js から @neondatabase/serverless HTTP ドライバーに移行

## 背景

`apps/web/src/lib/db.ts` が `postgres`（postgres-js）+ `drizzle-orm/postgres-js` を使用している。
このドライバーは TCP/WebSocket コネクションを確立するためコールドスタート時に数百ms〜1秒のコストが発生する。
`@neondatabase/serverless` の HTTP ドライバーはコネクションレスで各クエリを HTTP リクエストとして送信するため大幅に高速。

## 参照

- GitHub Issue: #55
- 関連ドキュメント: なし（インフラ最適化のため docs/features/ には対応ファイルなし）

## 実装方針

- 通常クエリ: `@neondatabase/serverless` の `neon()` HTTP クライアント + `drizzle-orm/neon-http`
- トランザクション: `@neondatabase/serverless` の `Pool`（WebSocket）+ `drizzle-orm/neon-serverless`

**トランザクションを使っている箇所（2箇所）**:
1. `apps/web/src/app/[locale]/admin/applications/actions.ts:31` — `approveApplication`（会社・組織・メンバー・ユーザー種別・申請ステータスの一括更新）
2. `apps/web/src/lib/withdrawal.ts:61` — `withdrawUser`（ユーザー退会の一括論理削除）

両者ともデータ整合性が必須なため、WebSocket ドライバーを使った `dbTransaction` ヘルパー経由でトランザクションを実行する。

### db.ts の設計

```ts
// HTTP ドライバー（通常クエリ用・高速）
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// WebSocket ドライバー（トランザクション専用）
// lazy initialization パターンで関数インスタンスをまたいでプールを使い回さない
export function createTransactionDb() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  return drizzle(pool, { schema });
}
```

または `drizzle-orm/neon-http` の `db.transaction()` が実は neon-http でも動作する場合は不要（要確認）。
**注**: `drizzle-orm/neon-http` はトランザクション非対応のため、`db.transaction()` を呼ぶとエラーになる。WebSocket ドライバーが必須。

## 実装ステップ

1. **依存パッケージの変更**
   - `apps/web`: `postgres` を削除、`@neondatabase/serverless` を追加（`ws` も必要な場合は追加）
   - `packages/db`: 同様に `postgres` を削除、`@neondatabase/serverless` を追加
   - `pnpm` ワークスペースのルートで `pnpm install` を実行

2. **`apps/web/src/lib/db.ts` の書き換え**
   - `import postgres from 'postgres'` → `import { neon } from '@neondatabase/serverless'`
   - `import { drizzle } from 'drizzle-orm/postgres-js'` → `import { drizzle } from 'drizzle-orm/neon-http'`
   - `const client = postgres(...)` → `const sql = neon(process.env.DATABASE_URL!)`
   - `export const db = drizzle(client, { schema })` → `export const db = drizzle(sql, { schema })`
   - lazy initialization パターンでモジュールスコープの初期化を関数内に移動

3. **トランザクション用の `dbWs` を追加**
   - `@neondatabase/serverless` の `Pool` + `drizzle-orm/neon-serverless` で WebSocket ドライバーインスタンスを作成
   - `export function withDbTransaction<T>(fn: (tx) => Promise<T>): Promise<T>` ヘルパーを追加
   - または `export const dbWs` をエクスポートして呼び出し側で `.transaction()` を使う

4. **`actions.ts` と `withdrawal.ts` の更新**
   - `db.transaction(...)` を `dbWs.transaction(...)` または `withDbTransaction(...)` に変更
   - import 先を更新（`@/lib/db` から `dbWs` もインポート）

5. **`packages/db/drizzle.config.ts` の確認**
   - `drizzle-kit` は `postgres` ドライバーを使う場合がある → `@neondatabase/serverless` 対応の設定に変更が必要か確認する
   - `driver: 'pg'` などの設定が必要な場合は修正する

6. **型確認・ビルド確認**
   - `pnpm -F web typecheck` または `pnpm build` でエラーがないことを確認

## 影響範囲

- `apps/web/package.json` — 依存変更（`postgres` 削除、`@neondatabase/serverless` 追加）
- `apps/web/src/lib/db.ts` — 全面書き換え
- `apps/web/src/app/[locale]/admin/applications/actions.ts` — トランザクション呼び出し変更
- `apps/web/src/lib/withdrawal.ts` — トランザクション呼び出し変更
- `packages/db/package.json` — 依存変更（`postgres` 削除、`@neondatabase/serverless` 追加）
- `packages/db/drizzle.config.ts` — 設定変更（要確認）

## チェックリスト

- [ ] `apps/web/package.json` から `postgres` を削除し `@neondatabase/serverless` を追加
- [ ] `packages/db/package.json` から `postgres` を削除し `@neondatabase/serverless` を追加
- [ ] `apps/web/src/lib/db.ts` を neon-http + lazy initialization に書き換え
- [ ] トランザクション用 WebSocket ドライバーを `db.ts` に追加
- [ ] `actions.ts` のトランザクションを WebSocket ドライバー経由に変更
- [ ] `withdrawal.ts` のトランザクションを WebSocket ドライバー経由に変更
- [ ] `packages/db/drizzle.config.ts` の設定確認・修正
- [ ] `pnpm install` 後にビルドエラーがないことを確認
- [ ] Playwright で `/admin/applications` と退会フローの動作確認（トランザクション正常動作）
