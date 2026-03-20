# Issue #22: イベント詳細ページの実装 — /dashboard/event/[eventId]

## 背景

Issue #21 で追加した参加予定セクションのリンク先として、イベント詳細ページを実装する。
ダッシュボード配下の `/[locale]/dashboard/event/[eventId]` ルートで、
認証済みユーザーがイベントの基本情報と自分の参加ステータスを確認できる。

## 参照

- GitHub Issue: #22
- Issue #21（参加予定セクションから遷移元）
- apps/web/src/lib/events.ts（既存の events クエリ）
- packages/db/src/schema.ts（events, eventParticipations, organizations テーブル）
- docs/architecture/decisions.md #2（UTC→ロケール変換）, #3（publishedのみ表示）

## 実装方針

- Server Component で実装（認証チェック → DB fetch → 表示）
- dashboard/layout.tsx がヘッダー/フッターを提供するため、page.tsx は main コンテンツのみ
- `notFound()` で 404 を返す（published + deleted_at IS NULL でなければ）
- 参加ステータスは userId がある場合のみ表示（eventParticipations を LEFT JOIN or 別クエリ）
- location は null の場合は非表示

## 実装ステップ

1. **`apps/web/src/lib/events.ts` に `getEventDetail` を追加**
   ```ts
   export type EventDetail = {
     id: string;
     title: string | null;
     startAt: string | null;
     endAt: string | null;
     location: string | null;
     orgName: string;
     myParticipationStatus: 'registered' | 'cancelled' | null;
   };

   export async function getEventDetail(
     eventId: string,
     userId: string
   ): Promise<EventDetail | null>
   ```
   - events JOIN organizations（orgId）
   - LEFT JOIN eventParticipations（eventId + userId + deletedAt IS NULL）
   - WHERE events.id = eventId AND events.status = 'published' AND events.deletedAt IS NULL

2. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` を作成**
   - getUser() → 未認証なら redirect
   - getEventDetail(eventId, user.id) → null なら notFound()
   - 表示: タイトル、日時、場所、主催バー名、参加ステータス、戻るボタン

3. **翻訳キー追加** (`ja.json` / `en.json`)
   - `event_detail.back`
   - `event_detail.start_at`
   - `event_detail.end_at`
   - `event_detail.location`
   - `event_detail.organizer`
   - `event_detail.my_status`
   - `event_detail.not_found`

## 影響範囲

- `apps/web/src/lib/events.ts`（関数追加）
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`（新規）
- `apps/web/messages/ja.json` / `en.json`（翻訳キー追加）

## チェックリスト

- [ ] `getEventDetail` を events.ts に追加
- [ ] イベント詳細ページを作成
- [ ] notFound() で 404 処理
- [ ] 参加ステータスを表示（参加済みの場合のみ）
- [ ] 戻るボタン（ダッシュボードへ）
- [ ] ja.json / en.json 翻訳キー追加
- [ ] Playwright で動作確認
