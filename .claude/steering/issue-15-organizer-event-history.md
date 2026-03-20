# Issue #15: ダッシュボードに主催イベント履歴を表示する

## 背景

ログインユーザーが過去に主催したイベントの一覧をダッシュボードに表示する。
イベンターが自分の実績を確認できるようにすることが目的。

## 参照

- GitHub Issue: #15
- 関連ドキュメント: `docs/features/organizer-history.md`
- 既存実装: `apps/web/src/lib/events.ts`（`getEventsForCalendar` 関数）
- ダッシュボードページ: `apps/web/src/app/[locale]/dashboard/page.tsx`
- DBスキーマ: `packages/db/src/schema.ts`（`events` テーブル: `userId` = 作成者）

## 実装方針

- `events.userId = 現在のユーザーID` で絞り込む
- 表示対象ステータス: `completed`（自分のダッシュボードのみ `cancelled` / `rejected` も表示）
  - ※ `eventStatusEnum` に `completed` がない点に注意 → スキーマ確認必須（Issue 記載では `completed` だが現在の enum にない）
  - **TBD**: `completed` ステータスがスキーマに存在しない場合の扱い → `docs/features/organizer-history.md` では `completed` になったイベントのみ対象。現状の enum は `draft/pending/published/cancelled/rejected` のみ。`published` かつ `endAt < now` を「完了」とみなす設計原則に従う
- 新しい順（`startAt DESC` または `createdAt DESC`）に表示
- 公開/非公開設定は別 Issue（本 Issue では全件表示）

## 実装ステップ

1. `apps/web/src/lib/events.ts` に `getOrganizerHistory` 関数を追加
   - 引数: `userId: string`
   - 取得条件: `userId = 引数` かつ `deletedAt IS NULL` かつ `endAt < now`（完了扱い）または status が `published/cancelled/rejected`
   - ※ `completed` ステータスが存在しないため「`endAt` が過去かつ `published`」を completed 相当とみなす
   - cancelled/rejected は自分のダッシュボード用なので全件取得
   - 返却フィールド: `id`, `title`, `startAt`, `endAt`, `status`, `orgId`
2. `apps/web/src/app/[locale]/dashboard/page.tsx` に主催履歴カードを追加
   - `getOrganizerHistory(user.id)` を呼び出す
   - `userType === 'user'`（イベンター）の場合のみ表示
   - カードタイトル: 翻訳キー `dashboard.organizer_history_title`
   - 一覧はイベント名・開催日・ステータスを表示
   - 空の場合は「履歴はまだありません」表示
3. 翻訳キーを追加
   - `apps/web/messages/ja.json` の `dashboard` セクション
   - `apps/web/messages/en.json` の `dashboard` セクション

## 影響範囲

- `apps/web/src/lib/events.ts` — 関数追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — カード追加
- `apps/web/messages/ja.json` — 翻訳キー追加
- `apps/web/messages/en.json` — 翻訳キー追加

## チェックリスト

- [ ] `getOrganizerHistory(userId)` 関数を `events.ts` に追加
- [ ] `completed` ステータス相当のロジック（`endAt < now` かつ `published`）を実装
- [ ] `cancelled` / `rejected` もダッシュボードには含める
- [ ] 新しい順（`startAt DESC`）でソート
- [ ] ダッシュボードページにカードを追加（`userType === 'user'` のみ表示）
- [ ] 空状態（履歴なし）の表示
- [ ] `ja.json` / `en.json` 両方に翻訳キーを追加
- [ ] Playwright で動作確認（テストユーザーでログイン後に表示確認）
