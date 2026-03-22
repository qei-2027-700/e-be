# Issue #116: feat: イベントに最寄り駅フィールドを追加し路線セレクトボックスで検索できるようにする

## 背景

現在「最寄り路線（nearest_line）」は organizations テーブルに持っており、バー単位の固定値になっている。
イベントごとに開催場所が異なる場合もあるため、イベント単位で最寄り駅を設定できるようにする。

また現在の路線フィルターはテキスト入力（フリー入力）だが、セレクトボックスにして選択しやすくしたい。

## 参照

- GitHub Issue: #116
- 関連ドキュメント:
  - `docs/features/event-search.md`
  - `docs/features/event-creation.md`

## 実装方針

1. `events` テーブルに `nearest_station text` カラムを追加（任意項目）
2. 駅名 → 路線名のマッピング定数ファイルを新規作成（コードにハードコード）
3. イベント作成・編集フォームに「最寄り駅」テキスト入力を追加（任意）
4. イベント一覧の路線フィルターをテキスト入力 → セレクトボックスに変更
   - 表示する路線は DB に登録済みの `nearest_station` から動的に収集した路線のみ
5. `searchPublicEvents` の `line` フィルターを `events.nearest_station` ベースに変更
   - 指定路線に属する駅名リストを取得し、`events.nearest_station IN (...)` で絞り込む

## 実装ステップ

1. **路線マスタ定数ファイルを作成**
   - `packages/db/src/station-lines.ts`（または `apps/web/src/lib/station-lines.ts`）に定数を配置
   - データ構造: `{ station: string, lines: string[] }[]`
   - 主要な駅を含むマスタデータをハードコード（渋谷・新宿・恵比寿・六本木・表参道など）
   - ヘルパー関数を追加:
     - `getLinesByStation(station: string): string[]` — 駅名から路線一覧を返す
     - `getStationsByLine(line: string): string[]` — 路線名から駅名一覧を返す
     - `getAllLines(): string[]` — 全路線名一覧を返す

2. **DB スキーマ変更**
   - `packages/db/src/schema.ts` の `events` テーブルに `nearest_station: text('nearest_station')` を追加（nullable）
   - マイグレーションを生成: `pnpm --filter @e-be/db generate`

3. **`searchPublicEvents` のフィルターロジック変更**
   - `apps/web/src/lib/events.ts` の `line` フィルターを修正
   - `organizations.nearest_line` → `events.nearest_station` ベースに変更
   - 指定路線に対応する駅名一覧（`getStationsByLine`）を取得し `inArray(events.nearest_station, stations)` で絞り込む

4. **路線一覧を動的に取得するクエリを追加**
   - `searchPublicEvents` or 別の server action で、DB に登録済みの `nearest_station` の distinct 一覧を取得
   - その駅名一覧から `getLinesByStation` を使って路線名セットを構築して返す

5. **イベント作成フォームに最寄り駅入力欄を追加**
   - `apps/web/src/app/[locale]/dashboard/event/create/` の form コンポーネントに最寄り駅 input を追加
   - 翻訳キーを `ja.json` / `en.json` に追加（`event.nearestStation` など）
   - バリデーションスキーマに optional text フィールドを追加

6. **イベント編集フォームに最寄り駅入力欄を追加**
   - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/` の form に同様に追加

7. **路線フィルターをセレクトボックスに変更**
   - `apps/web/src/app/[locale]/events/events-filter.tsx` の路線フィルターを修正
   - テキスト入力 → `<Select>` コンポーネントに変更
   - 表示する路線は DB 登録済みの `nearest_station` から動的に算出した路線のみ（全路線は表示しない）
   - 路線が 0 件の場合はセレクトを非表示 or disabled にする

## 影響範囲

- `packages/db/src/schema.ts` — `events` テーブルに `nearest_station` 追加
- `packages/db/drizzle/` — マイグレーションファイル
- `packages/db/src/station-lines.ts`（新規）— 路線マスタ定数
- `apps/web/src/lib/events.ts` — `searchPublicEvents` のフィルターロジック変更
- `apps/web/src/app/[locale]/dashboard/event/create/` — 作成フォームに最寄り駅追加
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/` — 編集フォームに最寄り駅追加
- `apps/web/src/app/[locale]/events/events-filter.tsx` — 路線フィルターをセレクトボックスに変更
- `apps/web/messages/ja.json` / `apps/web/messages/en.json` — 翻訳キー追加

## チェックリスト

- [ ] `packages/db/src/schema.ts` に `nearest_station` カラムを追加した
- [ ] マイグレーションファイルを生成した
- [ ] 路線マスタ定数ファイルを作成した（駅名 → 路線名のマッピング）
- [ ] `searchPublicEvents` の `line` フィルターが `events.nearest_station` ベースになった
- [ ] DB の `nearest_station` から動的に路線一覧を収集する処理を実装した
- [ ] イベント作成フォームに「最寄り駅」入力欄を追加した（任意）
- [ ] イベント編集フォームに「最寄り駅」入力欄を追加した（任意）
- [ ] 路線フィルターがセレクトボックスになった（DB に登録済みの路線のみ表示）
- [ ] 翻訳キーを `ja.json` / `en.json` に追加した
- [ ] 型エラーがない（`pnpm tsc --noEmit`）
