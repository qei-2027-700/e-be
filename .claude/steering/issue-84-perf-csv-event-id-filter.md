# Issue #84: perf: CSV エクスポートの参加者数クエリに eventId フィルタを追加

## 背景

`apps/web/src/app/[locale]/dashboard/organizer-history/csv/route.ts` の参加者数取得クエリが全イベントの参加レコードをスキャンしている。参加レコードが増えるとパフォーマンスが劣化する。

## 参照

- GitHub Issue: #84
- 関連ドキュメント: `docs/features/organizer-history.md`

## 実装方針

`inArray(eventParticipations.eventId, eventIds)` を WHERE 句に追加し、対象イベント（主催者の履歴）のみをスキャンするようにする。既に `eventIds` は上で取得済みのため、`if (eventIds.length > 0)` ブロック内でそのまま使える。

## 実装ステップ

1. `apps/web/src/app/[locale]/dashboard/organizer-history/csv/route.ts` を開く
2. `inArray` を drizzle-orm のインポートに追加
3. `counts` クエリの `.where()` に `inArray(eventParticipations.eventId, eventIds)` を追加

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/organizer-history/csv/route.ts` のみ

## チェックリスト

- [ ] `inArray` が drizzle-orm からインポートされている
- [ ] WHERE 句に `inArray(eventParticipations.eventId, eventIds)` が追加されている
- [ ] CSV ダウンロードが正常に動作する（参加者数が正しく表示される）
