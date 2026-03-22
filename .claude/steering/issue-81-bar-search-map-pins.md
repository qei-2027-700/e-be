# Issue #81: feat: バー検索機能・map上でpin立て

## 背景

未ログインを含む全ユーザーが登録バーを検索・閲覧できる公開ページが未実装。
キーワード・エリアで絞り込みでき、地図上にピンを立てて場所を確認できる機能を実装する。

## 参照

- GitHub Issue: #81
- 関連ドキュメント: `docs/features/bar-search.md`
- 関連スキーマ: `packages/db/src/schema.ts` — `organizations` テーブル（name, slug, address, description, iconUrl, coverImageUrl, imageColor）

## 実装方針

### バー一覧・検索ページ (`/bars`)
- 未ログインでもアクセス可能な公開ルート
- キーワード検索（店舗名・説明文）と、エリア絞り込みをサポート
- `deletedAt IS NULL` の organizations を一覧表示

### 地図ピン（Map）
- 外部マップ API を使用してバーの位置にピンを立てる
- **`organizations` テーブルに `latitude` / `longitude` カラムがない**ため、住所文字列（`address`）から座標を取得するか、スキーマ拡張が必要
  - **TBD**: 座標カラムを schema に追加するか、住所ジオコーディングを動的に行うか → ユーザーに確認が必要
  - シンプルさ優先の方針に従い、まず「Google Maps リンク（住所渡し）」のみ実装し、インタラクティブな埋め込みマップは後続 Issue とする選択肢もある

### バー詳細ページ (`/bars/[slug]`)
- 店舗名・説明・イメージカラー・アイコン/カバー画像
- 住所・アクセス（コピーボタン付き）
- URL コピーボタン
- 開催予定イベント一覧（`published` かつ `start_at` が未来）
- 電話番号・URL・SNS（設定時のみ表示）

## 実装ステップ

1. `packages/db/src/schema.ts` の `organizations` テーブルに `latitude`（doublePrecision）と `longitude`（doublePrecision）カラムを追加（nullable）
2. `packages/db/` で `pnpm db:generate` → マイグレーションファイル生成、`pnpm db:migrate` 適用
3. `apps/web/src/lib/events.ts` に `getPublicOrgs()` 関数を追加（全公開バー取得、キーワードフィルタ対応、latitude/longitude 含む）
4. `apps/web/src/app/[locale]/bars/` ディレクトリを作成
   - `page.tsx` — バー一覧・検索ページ（Server Component）
   - `[slug]/page.tsx` — バー詳細ページ
5. 地図ライブラリに **Leaflet**（`leaflet` + `react-leaflet`）を使用
   - SSR 非対応のため `dynamic(() => import(...), { ssr: false })` でラップ
   - OpenStreetMap タイルを使用（API キー不要）
6. バー一覧ページ: 検索 input（キーワード）+ カード一覧 + Leaflet マップで全バーにピン
7. バー詳細ページ (`/bars/[slug]`):
   - 店舗名・説明・イメージカラー・アイコン/カバー画像
   - 住所・コピーボタン
   - URL コピーボタン
   - 単体バーの Leaflet マップ（lat/lng があれば表示）
   - 開催予定イベント一覧（`published` かつ `start_at` 未来）
8. middleware の公開パス設定確認（`/bars` は未認証 OK）
9. i18n キーを `ja.json` / `en.json` 両方に追加
10. Playwright で動作確認

## 影響範囲

- `packages/db/src/schema.ts` — latitude/longitude カラム追加
- `packages/db/drizzle/` — マイグレーションファイル（新規）
- `apps/web/src/app/[locale]/bars/` — 新規ディレクトリ
- `apps/web/src/lib/events.ts` — バー取得関数追加
- `apps/web/src/middleware.ts` — 公開パス確認
- `apps/web/messages/ja.json` / `en.json` — i18n キー追加
- `apps/web/package.json` — leaflet, react-leaflet, @types/leaflet 追加

## チェックリスト

- [ ] schema に latitude/longitude を追加しマイグレーション適用済み
- [ ] `/bars` ページが未ログインでアクセスできる
- [ ] キーワードでバーを絞り込める
- [ ] バーカードをクリックすると `/bars/[slug]` に遷移する
- [ ] バー詳細ページに店舗情報・開催予定イベントが表示される
- [ ] 住所コピーボタンが動作する
- [ ] URL コピーボタンが動作する
- [ ] 地図ピン（またはマップリンク）が表示される
- [ ] i18n キーが ja.json / en.json 両方に追加されている
- [ ] Playwright でスクリーンショット取得済み
