# Issue #81: feat: バー検索機能・map上でpin立て

## 背景

未ログインを含む全ユーザーが登録バーを検索・閲覧できる公開ページが未実装。
キーワード・エリアで絞り込みでき、地図上にピンを立てて場所を確認できる機能を実装する。

## 参照

- GitHub Issue: #81
- 関連ドキュメント: `docs/features/bar-search.md`
- 関連スキーマ: `packages/db/src/schema.ts` — `organizations` テーブル（name, slug, address, description, iconUrl, coverImageUrl, imageColor）

## ルート方針（確定）

`/bars` は作成しない。既存の `/stores` 配下に統合する。

- 店舗一覧・マップページ: `/stores` または `/stores/map`
- 店舗詳細ページ: `/stores/[slug]`（実装済み）

## 実装方針

### 店舗一覧・マップページ (`/stores/map`)
- 未ログインでもアクセス可能な公開ルート
- キーワード検索（店舗名・説明文）と、エリア絞り込みをサポート
- `deletedAt IS NULL` の organizations を一覧表示

### 地図ピン（Map）— TBD: 実装方式を選択すること

#### 選択肢 A: Leaflet（OpenStreetMap）埋め込みマップ

| | 内容 |
|---|---|
| メリット | インタラクティブ、API キー不要、ピンをクリックして店舗詳細へ遷移できる |
| デメリット | `latitude`/`longitude` カラムをスキーマに追加しマイグレーションが必要。既存店舗の座標データを別途投入する必要がある。SSR 非対応のため `dynamic import` が必要 |
| 必要作業 | schema 変更 → マイグレーション → 座標データ投入 → Leaflet 実装 |

#### 選択肢 B: Google Maps リンク（住所渡し）のみ

| | 内容 |
|---|---|
| メリット | スキーマ変更不要、実装がシンプル、住所さえあれば動く |
| デメリット | インタラクティブなマップ表示なし。「地図で見る」ボタンが Google Maps 外部リンクになる |
| 必要作業 | 住所から Google Maps URL を生成するだけ（`https://maps.google.com/?q=住所`） |

**→ 実装前にどちらにするかユーザーに確認すること。**

### 店舗詳細ページ (`/stores/[slug]`)（実装済み）
- 追加対応があれば別 Issue で管理

## 実装ステップ（地図方式確定後に着手）

1. 地図方式を選択（選択肢 A: Leaflet / 選択肢 B: Google Maps リンク）
2. **選択肢 A の場合のみ**: `packages/db/src/schema.ts` の `organizations` テーブルに `latitude`（doublePrecision）と `longitude`（doublePrecision）カラムを追加 → `pnpm db:generate` → `pnpm db:migrate`
3. `apps/web/src/lib/stores.ts` に `getPublicStores()` 関数を追加（全公開店舗取得、キーワードフィルタ対応）
4. `apps/web/src/app/[locale]/stores/map/` ディレクトリを作成
   - `page.tsx` — 店舗一覧・検索ページ（Server Component）
5. **選択肢 A の場合**: Leaflet（`leaflet` + `react-leaflet`）を追加、`dynamic import` でラップ
6. 店舗一覧ページ: 検索 input（キーワード）+ カード一覧 + マップ
7. middleware の公開パス設定確認（`/stores/map` は未認証 OK）
8. i18n キーを `ja.json` / `en.json` 両方に追加

## 影響範囲

- `packages/db/src/schema.ts` — latitude/longitude カラム追加（選択肢 A のみ）
- `packages/db/drizzle/` — マイグレーションファイル（選択肢 A のみ）
- `apps/web/src/app/[locale]/stores/map/` — 新規ディレクトリ
- `apps/web/src/lib/stores.ts` — 店舗取得関数追加
- `apps/web/src/middleware.ts` — 公開パス確認
- `apps/web/messages/ja.json` / `en.json` — i18n キー追加
- `apps/web/package.json` — leaflet, react-leaflet, @types/leaflet 追加（選択肢 A のみ）

## チェックリスト

- [ ] 地図方式を選択済み（A: Leaflet / B: Google Maps リンク）
- [ ] `/stores/map` ページが未ログインでアクセスできる
- [ ] キーワードで店舗を絞り込める
- [ ] 店舗カードをクリックすると `/stores/[slug]` に遷移する
- [ ] 地図ピン（または Google Maps リンク）が表示される
- [ ] i18n キーが ja.json / en.json 両方に追加されている
