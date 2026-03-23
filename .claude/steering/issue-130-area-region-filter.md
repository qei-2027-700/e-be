# Issue #130: イベント検索の地域フィルターを都道府県から広域エリアに変更する

## 背景

イベント検索画面の地域フィルターで現在 46 都道府県がすべて選択肢として表示されているが、
サービス展開エリアは限定的なため、9 つの広域エリアに絞った選択肢に変更する。
DB スキーマ変更は不要で、フロント側でエリア → 都道府県リストのマッピングを行う。

## 参照

- GitHub Issue: #130
- 関連ドキュメント: `docs/features/event-search.md`

## 実装方針

- エリア定数ファイル（`apps/web/src/lib/area-regions.ts`）を新規作成し、エリア名と対応都道府県リストを一元管理
- `events-filter.tsx` の `PREFECTURES` 配列をエリアリストに置き換え
- `searchPublicEvents` は現在 `prefecture` 単一値で `eq()` 比較しているため、複数値対応に変更（`inArray()`）
- URL クエリパラメータは `area=首都圏` のような形で渡し、サーバー側でエリア → 都道府県リストに変換
- 翻訳キーのラベルを `filter_prefecture` → `filter_area` に変更

## エリアマッピング定義

| エリアキー | 表示名 | 対象都道府県 |
|-----------|--------|------------|
| `metropolitan` | 首都圏 | 東京都・神奈川県・埼玉県・千葉県・茨城県・栃木県・群馬県・山梨県 |
| `shizuoka` | 静岡 | 静岡県 |
| `chubu` | 愛知（中部） | 愛知県・岐阜県・三重県 |
| `kyushu` | 九州 | 福岡県・佐賀県・長崎県・熊本県・大分県・宮崎県・鹿児島県・沖縄県 |
| `hokkaido` | 北海道 | 北海道 |
| `miyagi` | 宮城 | 宮城県 |
| `osaka` | 大阪 | 大阪府 |
| `kansai` | その他関西 | 京都府・兵庫県・奈良県・和歌山県・滋賀県 |
| `chugoku` | 中国地方 | 鳥取県・島根県・岡山県・広島県・山口県 |

## 実装ステップ

1. **`apps/web/src/lib/area-regions.ts` を新規作成**
   - `AREA_REGIONS` 定数（エリアキー → `{ label: string; prefectures: string[] }` のマップ）
   - `areaKeyToPrefectures(areaKey: string): string[]` 関数
   - `AREA_KEYS` 型（ユニオン型）

2. **`apps/web/src/lib/events.ts` を修正**
   - `SearchEventsOptions` の `prefecture?: string` を `area?: string` に変更
   - クエリ内の `eq(organizations.prefecture, prefecture)` を `inArray(organizations.prefecture, areaKeyToPrefectures(area))` に変更
   - `areaKeyToPrefectures` のインポートを追加

3. **`apps/web/src/app/[locale]/events/events-filter.tsx` を修正**
   - `PREFECTURES` 定数を削除
   - `AREA_REGIONS` をインポートし、エリアセレクトに置き換え
   - Props の `defaultPrefecture` → `defaultArea` にリネーム
   - URL パラメータ名を `prefecture` → `area` に変更

4. **`apps/web/src/app/[locale]/events/page.tsx` を修正**
   - `searchParams` の `prefecture` → `area` に変更
   - `searchPublicEvents` への引数を `area` に変更
   - `EventsFilter` への props を `defaultArea={area}` に変更
   - `buildPageUrl` 内のパラメータ名を `area` に変更

5. **翻訳キーを更新**
   - `apps/web/messages/ja.json`: `filter_prefecture` → `filter_area`、値を `"エリア"` に
   - `apps/web/messages/en.json`: `filter_prefecture` → `filter_area`、値を `"Area"` に
   - `events-filter.tsx` 内の翻訳キー参照も `filter_area` に変更

## 影響範囲

- `apps/web/src/lib/area-regions.ts`（新規作成）
- `apps/web/src/lib/events.ts`（`SearchEventsOptions` と検索クエリ修正）
- `apps/web/src/app/[locale]/events/events-filter.tsx`（UI 変更）
- `apps/web/src/app/[locale]/events/page.tsx`（props・searchParams 変更）
- `apps/web/messages/ja.json`（翻訳キー変更）
- `apps/web/messages/en.json`（翻訳キー変更）

## チェックリスト

- [ ] `area-regions.ts` に 9 エリアのマッピング定数が定義されている
- [ ] フィルター UI に 9 エリアの選択肢が表示される（46 都道府県は表示されない）
- [ ] エリア未選択時は全イベントが表示される
- [ ] エリアを選択して検索すると対応する都道府県のイベントのみ表示される
- [ ] URL クエリが `?area=metropolitan` 形式になっている
- [ ] 翻訳キーが `filter_area` に統一されている（ja/en 両方）
- [ ] TypeScript のコンパイルエラーがない
