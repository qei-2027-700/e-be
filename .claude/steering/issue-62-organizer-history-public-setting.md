# Issue #62: feat: 主催履歴・公開設定機能の実装

## 背景

ユーザーダッシュボードにある「主催イベント履歴」セクションに、公開/非公開トグル・CSV エクスポートを追加する。
また、プロフィールページ（`/[locale]/users/[userId]`）を新設し、公開設定の主催履歴を未ログインでも閲覧できるようにする。

## 参照

- GitHub Issue: #62
- 関連ドキュメント: `docs/features/organizer-history.md`
- アーキテクチャ: `docs/architecture/decisions.md`（§3 イベントステートマシン、§1 ソフトデリート）
- 既存実装: `apps/web/src/lib/events.ts`（`getOrganizerHistory` 関数）
- 既存実装: `apps/web/src/app/[locale]/dashboard/page.tsx`（主催履歴セクション済み）
- スキーマ: `packages/db/src/schema.ts`（`events` テーブルに `is_public` 未追加）

## ⚠️ 要確認: デフォルト公開/非公開の矛盾

| ソース | 内容 |
|-------|------|
| `docs/features/organizer-history.md` | デフォルトは**公開** |
| Issue #62 本文 | 公開設定のデフォルトは**非公開** |

**確認済み（2026-03-21）: デフォルトは公開（`is_public = true`）** — `docs/features/organizer-history.md` の記載に従う。Issue 本文の「非公開」は誤り。

## 実装方針

- `is_public` は `events` テーブルに boolean カラムを追加（Drizzle マイグレーション）
- `completed` ステータスは DB に持たず、`published` かつ `endAt < now()` から導出する（アーキテクチャ §3 に準拠）
- 公開/非公開トグルは Server Action で実装（Route Handler ではなく）
- CSV エクスポートは Route Handler で実装（ファイルダウンロードは Route Handler が適切）
- プロフィールページは未ログインでも閲覧可能 → `getUser()` を optional 扱いにする
- ダッシュボードの主催履歴には cancelled / rejected も表示（既存の `getOrganizerHistory` が対応済み）

## 実装ステップ

### 1. スキーマ変更 & マイグレーション

`packages/db/src/schema.ts` の `events` テーブルに追加:
```ts
isPublic: boolean('is_public').default(true).notNull(),
```

その後:
```bash
cd packages/db
pnpm drizzle-kit generate
pnpm drizzle-kit migrate  # または push（開発環境）
pnpm build  # dist を更新（アーキテクチャ §15 参照）
```

### 2. `getOrganizerHistory` 関数を拡張

`apps/web/src/lib/events.ts` の `OrganizerHistoryItem` 型に `isPublic: boolean` を追加。
クエリに `events.isPublic` を追加する。

### 3. 公開/非公開トグル Server Action

`apps/web/src/app/[locale]/dashboard/actions.ts`（または新規ファイル）に追加:
```ts
'use server'
export async function toggleEventPublic(eventId: string, isPublic: boolean)
```
- `getUser()` で認証チェック
- イベントの `userId` と一致することを確認（自分のイベントのみ変更可）
- `completed` 相当（`published` かつ `endAt < now()`）のイベントのみ操作可
- `db.update(events).set({ isPublic }).where(...)` で更新

### 4. ダッシュボードUIに公開/非公開トグルを追加

`apps/web/src/app/[locale]/dashboard/page.tsx` の主催履歴セクション（`organizerHistory`）:
- 各アイテムにトグル（Switch または ボタン）を追加
- Client Component として切り出す: `organizer-history-item.tsx`
- トグルが `cancelled` / `rejected` のイベントには表示しない（公開設定は completed のみ意味がある）

### 5. CSV エクスポート Route Handler

`apps/web/src/app/[locale]/dashboard/organizer-history/csv/route.ts` を新規作成:
```ts
export async function GET(request: Request) { ... }
```
- 認証チェック（`getUser()`）
- ユーザーの主催履歴を全件取得
- 出力項目: イベント名・開催日・バー名・参加者数・ステータス
- `Content-Type: text/csv`・`Content-Disposition: attachment` で返す
- ダッシュボードページに「CSVダウンロード」ボタンを追加

### 6. プロフィールページを新設

`apps/web/src/app/[locale]/users/[userId]/page.tsx` を新規作成:
- `getUser()` は optional（未ログインOK）
- DB クエリ: `users` + 公開主催履歴（`is_public = true` かつ completed のみ）
- `getPublicOrganizerHistory(userId)` を `events.ts` に新規追加
- 表示内容: ユーザー名・公開主催履歴リスト（イベント名・開催日・バー名）
- cancelled / rejected は表示しない

### 7. 翻訳キー追加

`apps/web/messages/ja.json` と `apps/web/messages/en.json` に追加:
- `dashboard.organizer_history_public`: "公開" / "Public"
- `dashboard.organizer_history_private`: "非公開" / "Private"
- `dashboard.organizer_history_toggle_public`: "公開にする" / "Make public"
- `dashboard.organizer_history_toggle_private`: "非公開にする" / "Make private"
- `dashboard.organizer_history_csv`: "CSVダウンロード" / "Download CSV"
- `profile.title`: "{name}のプロフィール" / "{name}'s profile"
- `profile.organizer_history_title`: "主催イベント履歴" / "Organizer history"
- `profile.organizer_history_empty`: "公開されている主催履歴はありません" / "No public organizer history"

## 影響範囲

- `packages/db/src/schema.ts` — `events.isPublic` 追加
- `packages/db/drizzle/` — マイグレーションSQLが生成される
- `apps/web/src/lib/events.ts` — `OrganizerHistoryItem` 型拡張、`getPublicOrganizerHistory` 追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — トグルUI・CSVボタン追加
- `apps/web/src/app/[locale]/dashboard/organizer-history-item.tsx` — 新規（Client Component）
- `apps/web/src/app/[locale]/dashboard/organizer-history/csv/route.ts` — 新規
- `apps/web/src/app/[locale]/users/[userId]/page.tsx` — 新規
- `apps/web/messages/ja.json` / `en.json` — 翻訳キー追加

## チェックリスト

- [ ] `is_public` カラムを `events` テーブルに追加（デフォルト true）
- [ ] Drizzle マイグレーションを生成・適用
- [ ] `@e-be/db` をビルドして dist を更新
- [ ] `getOrganizerHistory` の返り値に `isPublic` を追加
- [ ] `getPublicOrganizerHistory(userId)` を新規追加
- [ ] `toggleEventPublic` Server Action を実装（認証・所有者チェック）
- [ ] ダッシュボードの主催履歴にトグルUIを追加（completed のみ）
- [ ] CSV エクスポート Route Handler を実装
- [ ] ダッシュボードに「CSVダウンロード」ボタンを追加
- [ ] プロフィールページを新設（`/users/[userId]`）
- [ ] 翻訳キーを ja.json / en.json の両方に追加
- [ ] Playwright で動作確認（トグル・CSV・プロフィールページ表示）
