# Issue #126: /events ページ UI 改善 — PCグリッド(2〜3カラム)・サムネイル・店舗/最寄り駅表示

## 背景

イベント一覧ページ（`/events`）が現在リスト形式のため視認性が低い。
PC では 2〜3 カラムのカードグリッドに変更し、サムネイル・店舗名・最寄り駅を表示することでユーザー体験を向上させる。

## 参照

- GitHub Issue: #126
- 関連ドキュメント: `docs/features/event-search.md`
- 現在の実装: `apps/web/src/app/[locale]/events/page.tsx`
- データ取得: `apps/web/src/lib/events.ts`（`searchPublicEvents`）
- DBスキーマ: `packages/db/src/schema.ts`

## 実装方針

- **`nearestStation` は events テーブルにすでに存在**するため追加不要
- `thumbnailUrl` カラムのみ追加（nullable text）
- `searchPublicEvents` の select・型定義・返却値に `nearestStation` と `thumbnailUrl` を追加
- page.tsx をグリッドレイアウトに変更し、カードコンポーネントを実装（インライン実装、新規ファイル不要）
- サムネイル未設定時は SVG プレースホルダーをインラインで表示（`/public/images/event-placeholder.png` 配置でも可）
- i18n: 翻訳キーを追加する場合は `ja.json` と `en.json` 両方に追加

## 実装ステップ

1. **スキーマ変更**
   - `packages/db/src/schema.ts` の `events` テーブルに `thumbnailUrl: text('thumbnail_url')` を追加（`nearestStation` の下）
   - `pnpm db:generate` を実行してマイグレーションファイルを生成

2. **`searchPublicEvents` の更新**
   - `apps/web/src/lib/events.ts` の `PublicEventItem` 型に `nearestStation: string | null` と `thumbnailUrl: string | null` を追加
   - `searchPublicEvents` の `.select()` に `nearestStation: events.nearestStation` と `thumbnailUrl: events.thumbnailUrl` を追加
   - `rows.map()` の返却値にも追加

3. **プレースホルダー画像の配置**
   - `apps/web/public/images/event-placeholder.png` を配置（または SVG インライン実装）
   - PNG がなければ SVG をインラインコンポーネントとして定義する

4. **page.tsx のグリッドレイアウト化**
   - `<ul className="divide-y ...">` のリスト形式を廃止
   - `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">` に変更
   - 各イベントを `<Link>` でラップしたカードコンポーネントに変更
   - カード内に表示する情報:
     - サムネイル画像（上部、未設定時はプレースホルダー）
     - タイトル
     - 開催日時（`startDate`）
     - 店舗名（`event.orgName`）
     - 最寄り駅（`event.nearestStation`、あれば）
     - チャージ料（`chargeLabel`）
     - 残席（`seatsLabel`、あれば）

## 影響範囲

- `packages/db/src/schema.ts` — events テーブルに thumbnailUrl 追加
- `packages/db/src/migrations/` — マイグレーションファイル新規生成
- `apps/web/src/lib/events.ts` — PublicEventItem 型と searchPublicEvents の更新
- `apps/web/src/app/[locale]/events/page.tsx` — グリッドレイアウト化
- `apps/web/public/images/event-placeholder.png` （または SVG インライン）

## チェックリスト

- [ ] `packages/db/src/schema.ts` に `thumbnailUrl` を追加
- [ ] `pnpm db:generate` でマイグレーションファイルが生成される
- [ ] `PublicEventItem` 型に `nearestStation` と `thumbnailUrl` が追加されている
- [ ] `searchPublicEvents` が `nearestStation` と `thumbnailUrl` を返す
- [ ] `/events` ページが PC で 2〜3 カラムグリッド表示になっている
- [ ] モバイルは 1 カラム維持
- [ ] サムネイル未設定時にプレースホルダーが表示される
- [ ] 店舗名（orgName）が各カードに表示される
- [ ] 最寄り駅（nearestStation）が設定されている場合にカードに表示される
- [ ] ページネーション（前へ/次へ）が正常に動作する
