# Issue #60: feat: イベント参加・キャンセル機能の実装

## 背景

イベント詳細ページに参加表明・キャンセルボタンを追加する。
`event_participations` テーブルへの INSERT/UPDATE と定員チェック・通知送信を含む。

ダッシュボードの「参加予定」セクション（`getUpcomingParticipations`）と参加履歴（`getParticipationHistory`）、詳細ページの参加ステータス表示（`getEventDetail`）はすでに実装済み。
今回はそれらを活用しつつ、「ボタン操作でデータを書き込む」部分を追加する。

## 参照

- GitHub Issue: #60
- 関連ドキュメント: `docs/features/event-participation.md`
- 通知ドキュメント: `docs/features/notifications.md`
- アーキテクチャ: `docs/architecture/decisions.md` §3（ステートマシン）、§4（通知基盤）
- 既存スキーマ: `packages/db/src/schema.ts`（`eventParticipations`, `notifications`, `events`）
- 既存アクション: `apps/web/src/lib/actions/event.ts`
- 既存クエリ: `apps/web/src/lib/events.ts`（`getEventDetail`, `getUpcomingParticipations` など）
- 既存詳細ページ: `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
- 既存翻訳キー: `apps/web/messages/ja.json` の `event_detail`

## 実装方針

### 参加 Server Action（`joinEvent`）
1. 認証確認（`getDbUser()`）
2. イベント取得：`published` かつ `startAt > now`（開催前のみ）
3. 重複参加チェック：`eventParticipations` に `registered` レコードがないか確認
4. 定員チェック：`maxParticipants` が設定されている場合、`registered` 件数 < `maxParticipants`
5. `eventParticipations` に INSERT（`status: 'registered'`）
   - `uniqueIndex('unique_event_participation')` が存在するため、同一 `(eventId, userId)` が既にあれば `status` を `registered` に UPDATE する
6. イベント主催者（`events.userId`）へ `participation_received` 通知を INSERT

### キャンセル Server Action（`cancelParticipation`）
1. 認証確認
2. 参加レコード取得：自分の `registered` レコードかつ `deletedAt IS NULL`
3. イベント取得：`startAt > now`（開催前のみキャンセル可）
4. `eventParticipations.status` を `cancelled` に UPDATE
5. 通知は送らない（キャンセル時の通知仕様は TBD）

### 通知送信ヘルパー
- 既存の `notify()` 抽象層は未実装のため、`apps/web/src/lib/notify.ts` に `sendNotification(userId, type, title, body, payload?)` を新規作成する
- 内部では `db.insert(notifications).values(...)` を呼ぶ（シンプルな実装）
- `NOTIFICATION_TYPES` は `@e-be/db` からインポートする

### UI（詳細ページ）
- `getEventDetail` の戻り値に `participantCount` と `maxParticipants` を追加
- `isBeforeEvent`（`startAt > now`）を計算し、参加可能かどうかを判定
- 定員に達している場合は「キャンセル待ち」表示（ボタンは無効化）
- 参加ボタン・キャンセルボタンは `Client Component` として切り出す（form action）

## 実装ステップ

1. **`apps/web/src/lib/notify.ts` を新規作成**
   - `sendNotification(userId: string, type: string, title: string, body: string, payload?: object)` 関数
   - `db.insert(notifications).values(...)` のみ

2. **`apps/web/src/lib/events.ts` に `getEventParticipantCount` を追加**
   - 指定イベントの `registered` かつ `deletedAt IS NULL` の件数を返す

3. **`getEventDetail` の戻り値を拡張**
   - `participantCount: number` と `maxParticipants: number | null` を追加

4. **`apps/web/src/lib/actions/participation.ts` を新規作成**（`'use server'`）
   - `joinEvent(eventId: string): Promise<ActionResult>`
   - `cancelParticipation(eventId: string): Promise<ActionResult>`
   - それぞれでバリデーション → DB 操作 → 通知送信

5. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/participation-button.tsx` を新規作成**（`'use client'`）
   - `joinEvent` / `cancelParticipation` を呼ぶ form ボタン
   - 状態: 未参加・参加中・定員満・開催後 の 4 状態
   - `useTransition` で pending 表示

6. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` を更新**
   - `EventDetail` 型の拡張フィールドを表示
   - `ParticipationButton` を組み込む
   - `isBeforeEvent` 計算をサーバー側で行い props として渡す

7. **翻訳キーの追加**（`ja.json` と `en.json` の `event_detail` セクション）
   - `join_button` / `cancel_button` / `join_success` / `cancel_success`
   - `full_capacity` / `already_registered` / `event_ended`
   - 通知タイトル・本文は Action 内にハードコード（i18n 不要）

8. **`packages/db/src/notification-types.ts` に定数を追加**
   - `PARTICIPATION_RECEIVED: 'participation_received'`

## 影響範囲

- **新規ファイル**
  - `apps/web/src/lib/notify.ts`
  - `apps/web/src/lib/actions/participation.ts`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/participation-button.tsx`
- **変更ファイル**
  - `apps/web/src/lib/events.ts`（`getEventDetail` の戻り値拡張 + `getEventParticipantCount`）
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`（ボタン組み込み）
  - `apps/web/messages/ja.json` / `en.json`（翻訳キー追加）
  - `packages/db/src/notification-types.ts`（定数追加）
- **DB 変更なし**（スキーマは既に `eventParticipations`, `notifications` テーブルあり）

## チェックリスト

- [ ] `sendNotification` ヘルパーを作成
- [ ] `packages/db/src/notification-types.ts` に `PARTICIPATION_RECEIVED` 追加
- [ ] `getEventParticipantCount` を `events.ts` に追加
- [ ] `getEventDetail` の戻り値に `participantCount` / `maxParticipants` を追加
- [ ] `joinEvent` Server Action を実装（認証・重複チェック・定員チェック・INSERT・通知）
- [ ] `cancelParticipation` Server Action を実装（認証・所有権チェック・開催前チェック・UPDATE）
- [ ] `ParticipationButton` クライアントコンポーネントを作成
- [ ] 詳細ページに `ParticipationButton` を組み込み
- [ ] `ja.json` / `en.json` に翻訳キーを追加
- [ ] Playwright で動作確認（参加→ステータス表示→キャンセル）
