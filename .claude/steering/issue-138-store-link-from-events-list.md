# Issue #138: イベント一覧カードから店舗詳細ページへのリンク追加

## 背景

`/stores/[slug]` ページは実装済み（#136）。
イベント詳細ページの店舗リンクは #141 で対応済み。
残りはイベント一覧カード（EventsList）の店舗名リンク化。

## 参照

- GitHub Issue: #138
- 変更対象:
  - `apps/web/src/lib/events.ts` — `PublicEventItem` 型 / `searchPublicEvents`
  - `apps/web/src/app/[locale]/events/events-list.tsx`

## 実装方針

### 1. `PublicEventItem` に `orgSlug` を追加

`apps/web/src/lib/events.ts`:
- `PublicEventItem` 型に `orgSlug: string | null` を追加
- `searchPublicEvents` の SELECT に `orgSlug: organizations.slug` を追加
- 戻り値マッピングに `orgSlug: row.orgSlug ?? null` を追加

### 2. EventsList カードの店舗名をリンク化

`apps/web/src/app/[locale]/events/events-list.tsx`:

カード全体が `<Link href="/events/[id]">` で囲まれているため、
店舗名リンクは `onClick={e => e.preventDefault()}` ではなく、
**カード外側の `<Link>` を `<div>` に変更し、タイトルクリックでイベント詳細へ遷移する構造**に変更する。

具体的には：
- 外側の `<Link>` → `<div>` に変更（`href` 削除、`group` クラスは維持）
- タイトル `<p>` → `<Link href="/events/[id]">` に変更
- 店舗名 `<p>` → `orgSlug` がある場合 `<Link href="/stores/[slug]">` に変更

```tsx
// 外側: Link → div
<div key={event.id} className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50">

  {/* サムネイルもイベント詳細へのリンクに */}
  <Link href={`/${locale}/events/${event.id}`} className="relative aspect-video ...">
    ...
  </Link>

  <div className="flex flex-1 flex-col gap-2 p-4">
    {/* タイトル → イベント詳細リンク */}
    <Link href={`/${locale}/events/${event.id}`} className="line-clamp-2 font-medium leading-snug hover:underline">
      {event.title ?? "—"}
    </Link>

    <div className="space-y-0.5 text-xs text-muted-foreground">
      {/* 店舗名 → 店舗詳細リンク（orgSlug がある場合のみ） */}
      {event.orgSlug ? (
        <Link href={`/${locale}/stores/${event.orgSlug}`} className="truncate block hover:underline hover:text-foreground">
          {event.orgName}
        </Link>
      ) : (
        <p className="truncate">{event.orgName}</p>
      )}
      {event.nearestStation && (
        <p className="truncate">{event.nearestStation}</p>
      )}
    </div>
    ...
  </div>
</div>
```

## 実装ステップ

1. `apps/web/src/lib/events.ts`
   - `PublicEventItem` 型に `orgSlug: string | null` を追加
   - `searchPublicEvents` の SELECT に `orgSlug: organizations.slug` を追加
   - 戻り値マッピングに `orgSlug: row.orgSlug ?? null` を追加

2. `apps/web/src/app/[locale]/events/events-list.tsx`
   - 外側 `<Link>` を `<div>` に変更
   - サムネイルとタイトルを個別の `<Link>` に変更
   - 店舗名を条件付き `<Link>` に変更

## 受け入れ条件

- [ ] イベント一覧カードの店舗名が `/stores/[slug]` へのリンクになっている
- [ ] カードのサムネイル・タイトルクリックでイベント詳細へ遷移する
- [ ] `orgSlug` が null の場合は店舗名がテキストのまま
- [ ] TypeScript エラーなし

## 影響範囲

- `apps/web/src/lib/events.ts`（型・クエリ変更）
- `apps/web/src/app/[locale]/events/events-list.tsx`
- 翻訳キー追加なし
