# Issue #21: ダッシュボード：参加予定セクションの追加と参加履歴の表示ロジック変更

## 背景

現在「参加イベント履歴」に `registered`（参加予定）と `cancelled` の両方が表示されているが、
参加予定のイベントは別セクション「参加予定イベント」に移動し、履歴には完了・キャンセル済みのみ表示する。

## 参照

- GitHub Issue: #21
- apps/web/src/lib/events.ts（既存の getParticipationHistory）
- apps/web/src/app/[locale]/dashboard/page.tsx（ダッシュボード）
- docs/architecture/decisions.md #2（UTC）, #3（イベントステートマシン）

## 実装方針

- `ongoing` / `completed` は DB に持たず、`end_at` との比較で導出する（設計原則に従う）
- イベント詳細ページ URL は `/[locale]/dashboard/event/[eventId]`（#22 で実装予定）
  - 今回は Link を追加するが、詳細ページ自体は #22 で実装
- 参加予定セクションは主催履歴カードの**上**に配置（Issue 本文の指定）

## 実装ステップ

1. **`apps/web/src/lib/events.ts` の変更**
   - `getUpcomingParticipations(userId: string)` を追加:
     - `registered` かつ `events.endAt > now`
     - startAt ASC（近い順）
   - `getParticipationHistory` を変更:
     - `(registered かつ events.endAt < now) OR cancelled`
     - startAt DESC（新しい順）

2. **`apps/web/src/app/[locale]/dashboard/page.tsx` の変更**
   - `getUpcomingParticipations(user.id)` を並行取得に追加
   - 参加予定カードを主催履歴カードの上に追加
     - アイテムを `Link href={/${locale}/dashboard/event/${item.eventId}}` でラップ
   - 参加履歴カードは変更なし（バックエンドのフィルタが変わるだけ）

3. **翻訳キー追加** (`ja.json` / `en.json`)
   - `dashboard.upcoming_participations_title`
   - `dashboard.upcoming_participations_empty`

## 影響範囲

- `apps/web/src/lib/events.ts`
- `apps/web/src/app/[locale]/dashboard/page.tsx`
- `apps/web/messages/ja.json` / `en.json`

## チェックリスト

- [ ] `getUpcomingParticipations` を events.ts に追加
- [ ] `getParticipationHistory` を変更（endAt フィルタ追加）
- [ ] ダッシュボードに参加予定カード追加（リンク付き）
- [ ] ja.json / en.json に翻訳キーを追加
- [ ] Playwright で動作確認
