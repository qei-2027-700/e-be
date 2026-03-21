# Issue #41: feat: イベント下書き編集 — 日時設定・申請/公開アクション

## 背景

`draft` ステータスのイベントに日時（`start_at` / `end_at`）を設定し、バーへの申請（`pending`）または即時公開（`published`）を行えるようにする。`barHostPermissions` の有無によってアクションが変わる。

## 参照

- GitHub Issue: #41
- 関連ドキュメント: `docs/features/event-creation.md`
- アーキテクチャ: `docs/architecture/decisions.md` §イベントステータス管理（§3）
- 関連 Issue: #40（イベント作成フォーム）— `actions/event.ts` を共有

## 実装方針

- `[eventId]/edit/page.tsx` で既存の `draft` イベントを読み込み、日時・追加情報の編集フォームを提供する
- `barHostPermissions` テーブルを参照し、`revokedAt IS NULL` のレコードがあれば「許可済み」とみなす
- 申請・公開ボタンは日時が揃った時点でのみ活性化（フロントでバリデーション）
- 重複チェックは Server Action 内で行い、エラーメッセージをフロントに返す
- `pending` 中のイベントは日時フィールドを読み取り専用にする

## 実装ステップ

1. **`barHostPermissions` 確認クエリを追加** (`apps/web/src/lib/events.ts`)
   ```ts
   export async function hasBarHostPermission(userId: string, barId: string): Promise<boolean>
   ```
   - `barHostPermissions` テーブルで `userId` + `barId` + `revokedAt IS NULL` を確認

2. **重複チェックロジックを追加** (`apps/web/src/lib/events.ts`)
   ```ts
   export async function checkEventConflict(
     barId: string,
     startAt: Date,
     endAt: Date,
     excludeEventId?: string
   ): Promise<boolean>
   ```
   - 同バー・同時間帯に `published` / `pending` の events、または `bar_blocks` がないかを確認
   - `excludeEventId` は自分自身を除外するため（更新時に自己競合を避ける）

3. **Server Actions を追加** (`apps/web/src/lib/actions/event.ts`)

   **`updateEventDraft(eventId, formData)`**
   - 認証 + 所有権チェック（`events.user_id === 現在のユーザー`）
   - ステータスが `draft` であることを確認（`pending` 以降は変更不可）
   - `title`, `description`, `startAt`, `endAt`, `maxParticipants` を更新

   **`submitEvent(eventId)`** — `draft → pending`
   - 認証 + 所有権チェック
   - ステータスが `draft` であることを確認
   - `startAt` / `endAt` が NULL でないことを確認（必須バリデーション）
   - `startAt` が現在時刻より後であることを確認
   - `endAt` が `startAt` より後であることを確認
   - `checkEventConflict` で重複チェック
   - `barHostPermissions` を確認し、許可済みなら `publishEvent` を促す（申請不要）
   - `status` を `pending` に更新

   **`publishEvent(eventId)`** — `draft → published`
   - 認証 + 所有権チェック
   - ステータスが `draft` であることを確認
   - `startAt` / `endAt` バリデーション（submitEvent と同様）
   - `checkEventConflict` で重複チェック
   - `hasBarHostPermission` を確認（許可済みユーザーのみ公開可能）
   - `status` を `published` に更新

4. **下書き編集ページを新規作成** (`apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/page.tsx`)
   - Server Component
   - `getUser()` / `getDbUser()` で認証チェック
   - DB からイベントを取得（`events.userId === 現在のユーザー` かつ `deletedAt IS NULL`）
   - ステータスが `draft` 以外なら 404（または適切なリダイレクト）
   - `hasBarHostPermission(userId, event.orgId)` の結果を渡す
   - `<EventEditForm event={...} hasPermission={boolean} />` を render

5. **フォームコンポーネントを作成** (`apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`)
   - `'use client'`
   - 既存フィールド（タイトル・説明・定員）に加えて日時フィールドを追加:
     - `start_at`: `<Input type="datetime-local">`
     - `end_at`: `<Input type="datetime-local">`
   - 「下書き保存」ボタン: `updateEventDraft` を呼び出す
   - アクションボタン（日時が揃った場合のみ活性化）:
     - `hasPermission === false` → 「申請する」(`submitEvent`)
     - `hasPermission === true` → 「公開する」(`publishEvent`)
   - エラーはインライン表示

6. **イベント詳細ページに編集リンクを追加** (`apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`)
   - 既存の詳細ページは `published` のみ対応しているため、`draft` / `pending` のイベントも表示できるよう拡張を検討
   - Note: Issue に詳細ページの `draft` 対応は記載なし。最低限「編集ページへのリンク」を下書き編集ページから確認できれば可

7. **翻訳キーを追加** (`messages/ja.json`, `messages/en.json`)
   ```json
   "event_edit": {
     "title": "イベントを編集",
     "back": "イベント一覧へ戻る",
     "field_start_at": "開催開始日時",
     "field_end_at": "開催終了日時",
     "save_draft": "下書き保存",
     "submit": "申請する",
     "publish": "公開する",
     "submitting": "処理中...",
     "error_conflict": "この時間帯は他のイベントと重複しています",
     "error_past_date": "過去の日時は設定できません",
     "error_invalid_range": "終了日時は開始日時より後に設定してください",
     "error_datetime_required": "申請・公開には開始・終了日時が必須です",
     "error_permission_required": "このバーへの公開許可がありません"
   }
   ```

## 影響範囲

- **新規作成**:
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/page.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
- **変更**:
  - `apps/web/src/lib/actions/event.ts` — `updateEventDraft` / `submitEvent` / `publishEvent` 追加
  - `apps/web/src/lib/events.ts` — `hasBarHostPermission`, `checkEventConflict` 追加
  - `apps/web/messages/ja.json` — `event_edit` セクション追加
  - `apps/web/messages/en.json` — `event_edit` セクション追加
- **依存**: Issue #40 で作成する `apps/web/src/lib/actions/event.ts` のファイルを共有

## チェックリスト

- [ ] `draft` ステータスのイベントが編集ページで開ける
- [ ] `pending` ステータスのイベントで編集ページにアクセスすると 404 になる
- [ ] 日時が空の状態で「申請する」「公開する」ボタンが非活性である
- [ ] 過去の日時を設定するとバリデーションエラーが表示される
- [ ] `end_at` が `start_at` より前だとエラーが表示される
- [ ] 重複するイベントがある場合にエラーが表示される
- [ ] `barHostPermissions` なしのユーザーには「申請する」ボタンが表示される
- [ ] `barHostPermissions` ありのユーザーには「公開する」ボタンが表示される
- [ ] 申請後に `status` が `pending` になる
- [ ] 公開後に `status` が `published` になる
