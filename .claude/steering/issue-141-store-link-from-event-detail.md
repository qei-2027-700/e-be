# Issue #141: stores への導線を追加する

## 背景

`/stores/[slug]` ページは実装済みだが、どこからもリンクされていない。
イベント詳細ページ（ダッシュボード・公開）の「開催店舗」セクションから店舗ページへリンクする。

## 参照

- GitHub Issue: #141
- 関連ステアリング: `issue-136-public-store-detail-page.md`
- 変更対象:
  - `apps/web/src/lib/events.ts` — `EventDetail` 型 / `getEventDetail`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
  - `apps/web/src/app/[locale]/events/[eventId]/page.tsx`

## 実装方針

### 1. `getEventDetail` に `orgSlug` を追加

`apps/web/src/lib/events.ts` の SELECT に `organizations.slug as orgSlug` を追加し、
`EventDetail` 型に `orgSlug: string | null` を追加する。

```ts
// SELECT に追加
orgSlug: organizations.slug,

// 戻り値に追加
orgSlug: row.orgSlug ?? null,
```

### 2. ダッシュボード イベント詳細ページ

`apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`

「開催店舗」セクションの店舗名を、`orgSlug` がある場合は `/stores/[slug]` へのリンクにする。

```tsx
{event.orgSlug ? (
  <Link href={`/${locale}/stores/${event.orgSlug}`} className="font-medium hover:underline">
    {event.orgName}
  </Link>
) : (
  <p className="font-medium">{event.orgName}</p>
)}
```

### 3. 公開 イベント詳細ページ

`apps/web/src/app/[locale]/events/[eventId]/page.tsx` も同様に対応する。
（公開ページの `EventDetail` 型・クエリも同じ `getEventDetail` を使用しているため、型変更のみで対応可能）

## 実装ステップ

1. `apps/web/src/lib/events.ts`
   - `EventDetail` 型に `orgSlug: string | null` を追加
   - `getEventDetail` の SELECT に `orgSlug: organizations.slug` を追加
   - 戻り値マッピングに `orgSlug: row.orgSlug ?? null` を追加

2. `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
   - 「開催店舗」の店舗名を条件付きリンクに変更

3. `apps/web/src/app/[locale]/events/[eventId]/page.tsx`
   - 同様に「開催店舗」の店舗名を条件付きリンクに変更

## 受け入れ条件

- [ ] ダッシュボードのイベント詳細で開催店舗名が `/stores/[slug]` へのリンクになっている
- [ ] 公開イベント詳細でも同様にリンクになっている
- [ ] `orgSlug` が null の場合はリンクなしのテキスト表示にフォールバックする
- [ ] 既存の表示スタイルを壊さない

## 影響範囲

- `apps/web/src/lib/events.ts`（型・クエリ変更）
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
- `apps/web/src/app/[locale]/events/[eventId]/page.tsx`
- 翻訳キー追加なし（既存の `venue` キーをそのまま使用）
