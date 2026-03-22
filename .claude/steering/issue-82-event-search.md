# Issue #82: feat: イベント検索機能

## 背景

ダッシュボードに公開済みイベントを数件プレビュー表示し、「もっと見る」リンクからイベント一覧・検索ページへ遷移できるようにする。
検索ページでは開催日時・都道府県・路線でのフィルタリングが可能にする。

現状：
- ダッシュボードにはカレンダー・主催履歴・参加履歴が表示されているが、公開イベントの一覧は未実装
- `organizations` テーブルに `address` フィールドはあるが `prefecture`（都道府県）・`line`（路線）フィールドが存在しない
- イベント検索用のページ・クエリが未実装

## 参照

- GitHub Issue: #82
- 関連ドキュメント: `docs/features/event-search.md`

## 実装方針

- **検索ページは未ログインでも閲覧可能**（`docs/features/event-search.md` 記載、ログインガードなし）
- **フィルタは URL searchParams で管理**（Server Component + `useRouter` なしのシンプル設計）
- **都道府県・路線フィルタのために `organizations` テーブルにカラム追加が必要**
  - `prefecture: text('prefecture')` — 都道府県（例: "東京都"）
  - `nearestLine: text('nearest_line')` — 最寄り路線（例: "山手線"）
  - これらは任意項目。既存レコードは NULL のまま（Issue に記載なし、要確認）
  - 路線データのマスタは設けず、`organizations` 登録時にフリーテキストで入力（シンプルさ優先）
- **ダッシュボードプレビューは直近 3 件**（Issue に件数記載なし → 3 件を採用）
- **表示対象**: `published` かつ `start_at` が未来のイベントのみ（`docs/features/event-search.md` 記載）
- **ページネーション**: 一覧ページは無限スクロールではなく、ページ番号 or シンプルな「次へ」ボタン方式（Issue に記載なし、シンプルさ優先で 20件/ページ）

## 実装ステップ

### 1. DB スキーマ変更

`packages/db/src/schema.ts` の `organizations` テーブルに追加:

```ts
prefecture: text('prefecture'),      // 都道府県
nearestLine: text('nearest_line'),   // 最寄り路線
```

マイグレーション実行:
```bash
pnpm db:generate
pnpm db:migrate
```

### 2. イベント検索クエリの実装

`apps/web/src/lib/events.ts` に以下を追加:

```ts
export type PublicEventItem = {
  id: string;
  title: string | null;
  startAt: string | null;
  endAt: string | null;
  orgId: string;
  orgName: string;
  orgAddress: string | null;
  orgPrefecture: string | null;
  chargeAmount: number | null;
  maxParticipants: number | null;
  participantCount: number;
};

export type SearchEventsOptions = {
  date?: string;        // YYYY-MM-DD（この日に開催）
  prefecture?: string;  // 都道府県
  line?: string;        // 路線
  limit?: number;
  offset?: number;
};

export async function searchPublicEvents(opts: SearchEventsOptions): Promise<PublicEventItem[]>
```

フィルタ条件:
- 常に: `status = 'published' AND start_at > NOW() AND deletedAt IS NULL`
- `date` 指定時: `start_at::date = date`（日付の日付部分が一致）
- `prefecture` 指定時: `organizations.prefecture = prefecture`
- `line` 指定時: `organizations.nearest_line = line`（完全一致 or ILIKE 検索。要確認）

### 3. ダッシュボードへのプレビュー追加

`apps/web/src/app/[locale]/dashboard/page.tsx` に変更:
- `searchPublicEvents({ limit: 3 })` を呼ぶ（並行取得に追加）
- 左カラムのカレンダーの下に「開催予定イベント」カードを追加
- 「もっと見る」は `/${locale}/events` へリンク
- 各イベント行: タイトル・バー名・日付 → `/${locale}/dashboard/event/${id}` へリンク

### 4. イベント一覧・検索ページの作成

**ルート**: `apps/web/src/app/[locale]/events/page.tsx`（未ログインアクセス可）

```
/[locale]/events?date=2026-03-22&prefecture=東京都&line=山手線
```

**page.tsx**（Server Component）:
- `searchParams` からフィルタ値を取得
- `searchPublicEvents(opts)` でイベント取得
- フィルタ UI + 一覧を render

**フィルタ UI** (`events-filter.tsx`, Client Component):
- 日付: `<Input type="date" />` → `router.push` で searchParams 更新
- 都道府県: `<Select>` → 47都道府県リスト（ハードコードで十分）
- 路線: `<Input type="text" placeholder="例: 山手線" />`（フリーテキスト検索）
- 「検索」ボタン or debounce で自動適用（Issue に記載なし → ボタン方式でシンプルに）

**イベントカード**:
- タイトル・バー名・都道府県・日時・チャージ料・残席状況を表示
- 詳細ページ `/${locale}/dashboard/event/${id}` へリンク

### 5. i18n 翻訳キーの追加

翻訳ファイルに以下を追加（全ロケール）:

```json
"events": {
  "title": "イベント一覧",
  "filter_date": "開催日",
  "filter_prefecture": "都道府県",
  "filter_line": "路線",
  "filter_search": "検索",
  "filter_reset": "リセット",
  "empty": "条件に合うイベントが見つかりません",
  "see_more": "もっと見る"
},
"dashboard": {
  "upcoming_events_title": "開催予定イベント",
  "upcoming_events_empty": "公開中のイベントはありません"
}
```

ダッシュボードの既存翻訳キーに追記する。

### 6. Playwright で動作確認

- ダッシュボードにイベントプレビューが表示されるか
- 「もっと見る」で `/events` ページへ遷移するか
- 日付・都道府県・路線フィルタが動作するか
- フィルタを外すと全件表示されるか
- 未ログイン状態で `/events` にアクセスできるか

## 影響範囲

- `packages/db/src/schema.ts` — `organizations` に `prefecture`, `nearest_line` 追加
- `packages/db/` — マイグレーションファイル
- `apps/web/src/lib/events.ts` — `searchPublicEvents` 追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — プレビュー表示追加
- `apps/web/src/app/[locale]/events/page.tsx` — 新規作成
- `apps/web/src/app/[locale]/events/events-filter.tsx` — 新規作成（Client Component）
- 翻訳ファイル（`apps/web/src/messages/`）

## 確認事項（TBD）

- **路線フィルタの一致方法**: 完全一致 vs 部分一致（ILIKE）。Issue に記載なし → 部分一致（ILIKE `%line%`）を採用（路線名のバリエーションに対応しやすい）
- **`organizations` の `prefecture` / `nearest_line` の入力画面**: バー設定ページへの追加は別 Issue にするか？ 今回はデータなしで検索のみ実装し、設定画面は別対応とする
- **ページネーション**: 20件/ページ + 「次のページ」方式を採用（Issue に記載なし）
- **ダッシュボードプレビューの件数**: 3件（Issue に記載なし）
- **イベント一覧ページへの認証制御**: 未ログインでもアクセス可能（docs 記載どおり）。ダッシュボード内 `/dashboard/event/:id` への詳細リンクは既存の認証ミドルウェアで保護済み

## チェックリスト

- [ ] `organizations` に `prefecture`, `nearest_line` カラム追加・マイグレーション適用
- [ ] `searchPublicEvents` クエリが正常動作する（日付・都道府県・路線フィルタ含む）
- [ ] ダッシュボードにイベントプレビュー（3件）が表示される
- [ ] 「もっと見る」リンクが `/events` に遷移する
- [ ] `/events` ページが未ログインでアクセス可能
- [ ] 日付フィルタが動作する
- [ ] 都道府県フィルタが動作する
- [ ] 路線フィルタが動作する（部分一致）
- [ ] フィルタリセットで全件表示に戻る
- [ ] i18n 翻訳キーが全ロケール追加済み
- [ ] Playwright で動作確認済み
