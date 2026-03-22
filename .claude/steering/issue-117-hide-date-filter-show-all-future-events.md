# Issue #117: feat: イベント一覧の日付フィルターを非表示にし、デフォルトで本日以降の全件を表示する

## 背景

現在の `/events` 一覧に「開催日」フィルターがあるが用途が少なく UI がごちゃつく。
デフォルトで「本日以降のイベントを全件表示」が適切な動作。

## 参照

- GitHub Issue: #117
- 関連ドキュメント: `docs/features/event-search.md`
- 関連実装: `apps/web/src/app/[locale]/events/events-filter.tsx`, `apps/web/src/lib/events.ts`

## 実装方針

- UI から date フィルターを削除するのみ（`searchPublicEvents` の `date` オプション自体は保持して良い）
- デフォルトフィルターを `start_at > NOW()` → `start_at >= 今日の 00:00:00 UTC` に変更
  - `new Date()` の `setUTCHours(0,0,0,0)` で当日 00:00:00 UTC を生成

## 実装ステップ

1. **`searchPublicEvents` のデフォルトフィルター変更** (`apps/web/src/lib/events.ts`)
   - `gt(events.startAt, now)` を `gte(events.startAt, startOfToday)` に変更
   - `startOfToday` = `new Date()` で `setUTCHours(0,0,0,0)` したもの

2. **`EventsFilter` から date 関連を削除** (`apps/web/src/app/[locale]/events/events-filter.tsx`)
   - `date` state・JSX ブロック（開催日ラベル + DatePicker）を削除
   - Props から `defaultDate` を削除
   - `handleSubmit` / `handleReset` の `date` 参照を削除

3. **`events/page.tsx` の date 参照を削除** (`apps/web/src/app/[locale]/events/page.tsx`)
   - `searchParams` から `date` を削除
   - `EventsFilter` への `defaultDate` prop を削除
   - `searchPublicEvents` への `date` 引数を削除

4. **翻訳キーの整理**（任意）
   - `filter_date` / `filter_searching` キーは将来使う可能性があるため残置でも可

## 影響範囲

- `apps/web/src/lib/events.ts`
- `apps/web/src/app/[locale]/events/events-filter.tsx`
- `apps/web/src/app/[locale]/events/page.tsx`

## チェックリスト

- [ ] `searchPublicEvents` が本日 00:00:00 UTC 以降のイベントを返す
- [ ] `/events` ページに「開催日」フィルターが表示されない
- [ ] 都道府県・路線フィルターは引き続き動作する
- [ ] フィルターなしで本日以降のイベントが全件表示される
