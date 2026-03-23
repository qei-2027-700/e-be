# Issue #136: feat: 公開向け店舗詳細ページの新規作成 (/stores/[slug])

## 背景

一般ユーザーが店舗（organization）の詳細情報を閲覧できる公開ページを新規作成する。
URL は `/[locale]/stores/[slug]` とし、slug は organizations.slug を利用する。

## 参照

- GitHub Issue: #136
- 関連スキーマ: `packages/db/src/schema.ts` — organizations / events テーブル
- 参考実装: `apps/web/src/app/[locale]/events/[eventId]/page.tsx`

## 実装方針

- Server Component で実装（認証不要、未ログインユーザーも閲覧可）
- `getPublicStoreBySlug(slug)` を `apps/web/src/lib/stores.ts` に新規作成
  - organizations テーブルから slug で取得（deletedAt IS NULL）
  - その店舗の published イベント一覧（直近10件、startAt DESC）
- slug が存在しない場合は `notFound()`
- 翻訳キーは `stores` 名前空間で ja/en に追加

## 実装ステップ

1. `apps/web/src/lib/stores.ts` を新規作成
   - `getPublicStoreBySlug(slug)` — 店舗情報 + 公開イベント一覧
2. `apps/web/src/app/[locale]/stores/[slug]/page.tsx` を新規作成
3. `apps/web/messages/ja.json` / `en.json` に `stores` 名前空間を追加

## 表示内容

| 項目 | ソース |
|------|--------|
| 店舗名 | organizations.name |
| 説明 | organizations.description（あれば） |
| 住所 | organizations.address（あれば） |
| 最寄り路線 | organizations.nearestLine（あれば） |
| アイコン画像 | organizations.iconUrl（あれば） |
| カバー画像 | organizations.coverImageUrl（あれば） |
| 公開イベント一覧 | published、startAt DESC、上限10件 |

## 翻訳キー（stores 名前空間）

```json
{
  "stores": {
    "events_title": "開催イベント",
    "no_events": "現在公開中のイベントはありません",
    "charge_free": "無料",
    "seats_remaining": "残り{count}席",
    "seats_full": "満席"
  }
}
```

## 影響範囲

- `apps/web/src/lib/stores.ts`（新規）
- `apps/web/src/app/[locale]/stores/[slug]/page.tsx`（新規）
- `apps/web/messages/ja.json`
- `apps/web/messages/en.json`
