---
description: アーキテクチャ実装ルール — ソフトデリート・UTC・ステートマシン・通知・ストレージ・監査ログ
paths:
  - "apps/**"
  - "packages/**"
---

## ソフトデリート
- **全テーブルに `deleted_at` 列を必ず入れる**。`DELETE` 文は使わない
- クエリは常に `WHERE deleted_at IS NULL` を付ける（Drizzle のデフォルトスコープで実装）

## タイムゾーン
- **DB には必ず UTC で保存する**（`timestamp with time zone` 型）
- 表示時は `Intl.DateTimeFormat` でユーザーのロケールに変換する
- コンポーネントに `new Date()` をそのまま渡さない

## イベントステートマシン
- ステータス遷移は `packages/db/src/event-transitions.ts` の `canTransition(from, to)` を通す
- 直接 `event.status = 'published'` のように書かない
- `ongoing` / `completed` は DB に保存せず `start_at` / `end_at` から導出する（`resolveStatus()` を使う）

## 通知
- 通知送信は `notify(userId, type, payload)` を通す。Expo Push / Email を直接呼ばない
- 通知タイプは `packages/db/src/notification-types.ts` で一元管理する

## ファイルストレージ
- Supabase Storage のパス構造: `{type}/{orgId}/{entityId}/{filename}`
  - 例: `events/{orgId}/{eventId}/banner.webp`
  - 例: `users/{userId}/avatar.webp`
- パスを自前で組み立てない。必ずヘルパー関数を経由する

## 監査ログ
- イベント承認・キャンセル・ロール変更など主要操作は `audit_logs` テーブルに記録する
- Server Action / Route Handler の中で直接 insert する（ミドルウェアで自動化しない）
