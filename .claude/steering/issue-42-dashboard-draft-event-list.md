# Issue #42: feat: ダッシュボード — 自分の下書き・申請中イベント一覧表示

## 背景

ダッシュボードに、ログインユーザーが作成した `draft` / `pending` ステータスのイベントを一覧表示するセクションを追加する。イベント作成・下書き保存（Issue #40）と合わせて、イベンターが自分の進行中イベントを管理できる起点となる。

## 参照

- GitHub Issue: #42
- 関連ドキュメント: `docs/features/event-creation.md`
- アーキテクチャ: `docs/architecture/decisions.md` §イベントステータス管理（§3）
- 関連 Issue: #40（作成フォーム）、#41（編集・申請/公開）

## 実装方針

- 既存の `getOrganizerHistory()` は `completed / cancelled / rejected` を返すクエリ。今回は `draft / pending` 専用のクエリ `getMyDraftEvents()` を別関数として追加する
- ダッシュボードページ（Server Component）で `userType === 'user'` のときのみ並行取得して表示
- カードクリック先: `draft` → 編集ページ (`/dashboard/event/[eventId]/edit`)、`pending` → 詳細ページ（Issue に記載なし; 編集ページで pending を読み取り専用表示する方針で実装）

## 実装ステップ

1. **`getMyDraftEvents()` クエリを追加** (`apps/web/src/lib/events.ts`)
   ```ts
   export type MyDraftEventItem = {
     id: string;
     title: string | null;
     status: 'draft' | 'pending';
     orgName: string;
     createdAt: string; // ISO 8601
   };

   export async function getMyDraftEvents(userId: string): Promise<MyDraftEventItem[]>
   ```
   - `events` テーブルと `organizations` を JOIN（`events.org_id = organizations.id`）
   - 条件: `events.user_id = userId` かつ `status IN ('draft', 'pending')` かつ `events.deleted_at IS NULL`
   - 返却: `id`, `title`, `status`, `organizations.name as orgName`, `createdAt`
   - 並び順: `createdAt DESC`（新しいものが上）

2. **ダッシュボードページに一覧セクションを追加** (`apps/web/src/app/[locale]/dashboard/page.tsx`)
   - `userType === 'user'` のブロック内で `getMyDraftEvents(user.id)` を `Promise.all` に追加
   - セクション位置: 「イベントを作成」ボタンの下、既存の主催履歴セクションの上
   - UI 構成:
     - `<Card>` + `<CardHeader>` + `<CardTitle>` でセクション化
     - イベントがある場合: `<Link>` でラップされたイベントカード一覧
       - 各カード: タイトル・ステータスバッジ（draft=secondary / pending=warning色）・バー名・作成日
     - イベントがない場合: 「まだ作成中のイベントはありません」テキスト + 「イベントを作成」リンクボタン
   - リンク先:
     - `draft` → `/${locale}/dashboard/event/${id}/edit`
     - `pending` → `/${locale}/dashboard/event/${id}` （詳細ページ; pending での表示は既存ページで要確認）

3. **翻訳キーを追加** (`messages/ja.json`, `messages/en.json`)
   ```json
   // dashboard オブジェクトに追加
   "my_events_title": "作成中・申請中のイベント",
   "my_events_empty": "まだ作成中のイベントはありません",
   "create_event": "イベントを作成",
   "event_status_draft": "下書き",
   "event_status_pending": "申請中"
   ```

## 影響範囲

- **変更**:
  - `apps/web/src/lib/events.ts` — `getMyDraftEvents()` + `MyDraftEventItem` 型を追加
  - `apps/web/src/app/[locale]/dashboard/page.tsx` — セクション追加・並行取得の拡張
  - `apps/web/messages/ja.json` — `dashboard` 内にキー追加
  - `apps/web/messages/en.json` — `dashboard` 内にキー追加
- **新規作成ファイルなし**

## 実装上の注意

- `draft` イベントは `published` ではないため、既存の `getEventDetail()` では取得できない。`pending` のリンク先として詳細ページを使う場合は、別途 `getDraftEventDetail()` が必要になる可能性がある（Issue #41 の edit ページで代用可能なら不要）。要確認
- `getMyDraftEvents()` の `status` 型を Drizzle の enum 型に合わせること（`events.status` の型推論を活用）

## チェックリスト

- [ ] `getMyDraftEvents()` が `draft` / `pending` のイベントのみ返す
- [ ] `getMyDraftEvents()` が他ユーザーのイベントを返さない
- [ ] ダッシュボードに「作成中・申請中のイベント」セクションが表示される（userType=user のみ）
- [ ] `venue_user` のダッシュボードには表示されない
- [ ] イベントカードにタイトル・ステータスバッジ・バー名・作成日が表示される
- [ ] カードクリックで適切なページへ遷移する
- [ ] イベントがない場合に空状態メッセージと「イベントを作成」ボタンが表示される
