# Issue #40: feat: イベント作成フォーム — バー選択・基本情報入力・下書き保存

## 背景

イベンター（userType=user）が、開催したいバーを選んでイベントの基本情報を入力し、`draft` として保存できるフォームを実装する。日程が未定でも企画を先に保存できることが要件。

## 参照

- GitHub Issue: #40
- 関連ドキュメント: `docs/features/event-creation.md`
- アーキテクチャ: `docs/architecture/decisions.md` §イベントステータス管理

## 実装方針

- **フォーム構成**: Server Component のページ + Client Component のフォーム + Server Action
- **バー選択**: ユーザーが参照できるバー（公開済み organizations）をセレクトボックスで提供
  - Note: `userType=user` がバーを選択する際の「参照できるバーの範囲」は Issue に記載なし。
    `organizations` テーブルの全件（deletedAt IS NULL）を表示する方針で実装し、必要なら後から絞り込む
- **Server Action**: `apps/web/src/lib/actions/event.ts` を新規作成し `createEventDraft` を実装
- **リダイレクト**: 保存成功後は作成したイベントの詳細/編集ページへ遷移
- **i18n**: `messages/ja.json` と `messages/en.json` にキーを追加

## 実装ステップ

1. **バー一覧取得クエリを追加** (`apps/web/src/lib/events.ts`)
   ```ts
   // 公開バー一覧取得（イベント作成フォームのセレクトボックス用）
   export async function getPublicBars(): Promise<{ id: string; name: string }[]>
   ```
   - `organizations` テーブルから `deletedAt IS NULL` の全件を取得
   - `id`, `name` のみ SELECT

2. **Server Action を新規作成** (`apps/web/src/lib/actions/event.ts`)
   ```ts
   'use server';
   // createEventDraft(formData: FormData): Promise<{ error: string } | { eventId: string }>
   ```
   - 認証チェック（`getUser()` + `getDbUser()`）
   - `userType` が `user` であることを確認
   - バリデーション:
     - `orgId`: 必須、UUIDであること
     - `title`: 必須、1〜100文字
     - `description`: 必須、1〜2000文字
     - `maxParticipants`: 任意、数値なら 1〜500
   - `db.insert(events)` で `status: 'draft'` として保存
   - 成功時は `{ eventId }` を返す（リダイレクトはクライアント側で）

3. **イベント作成ページを新規作成** (`apps/web/src/app/[locale]/dashboard/event/create/page.tsx`)
   - Server Component
   - `getUser()` / `getDbUser()` で認証チェック → 未認証は `notFound()`
   - `userType !== 'user'` なら `notFound()`（または forbidden）
   - `getPublicBars()` でバー一覧を取得
   - `<EventCreateForm bars={bars} />` を render

4. **フォームコンポーネントを作成** (`apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`)
   - `'use client'`
   - shadcn/ui: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Input`, `Label`, `Textarea`, `Select`
   - フィールド:
     - バー選択（`<Select>` / セレクトボックス）— 必須
     - タイトル（`<Input>`）— 必須、maxLength=100
     - 説明（`<Textarea>`）— 必須、maxLength=2000
     - 定員（`<Input type="number">`）— 任意、1〜500
   - `useTransition` で pending 状態管理
   - `createEventDraft` 呼び出し後、`router.push` で編集ページへ遷移
   - エラーはインライン表示

5. **ダッシュボードに「イベントを作成」ボタンを追加** (`apps/web/src/app/[locale]/dashboard/page.tsx`)
   - `userType === 'user'` のセクションに `<Link href={`/${locale}/dashboard/event/create`}>` ボタンを追加
   - shadcn/ui `Button` を使用

6. **翻訳キーを追加**
   - `messages/ja.json` に `event_create` セクションを追加:
     ```json
     "event_create": {
       "title": "イベントを作成",
       "back": "ダッシュボードへ戻る",
       "field_bar": "開催バー",
       "field_bar_placeholder": "バーを選択してください",
       "field_title": "タイトル",
       "field_title_placeholder": "例: 渋谷ジャズナイト Vol.1",
       "field_description": "説明",
       "field_description_placeholder": "イベントの内容・雰囲気などを書いてください",
       "field_max_participants": "定員",
       "field_max_participants_placeholder": "未設定の場合は定員なし",
       "submit": "下書き保存",
       "submitting": "保存中...",
       "error_unauthorized": "ログインが必要です",
       "error_forbidden": "イベント作成権限がありません",
       "error_invalid": "入力内容を確認してください",
       "error_unknown": "エラーが発生しました。もう一度お試しください"
     }
     ```
   - `messages/en.json` にも同様に追加

## 影響範囲

- **新規作成**:
  - `apps/web/src/lib/actions/event.ts`
  - `apps/web/src/app/[locale]/dashboard/event/create/page.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`
- **変更**:
  - `apps/web/src/lib/events.ts` — `getPublicBars()` 追加
  - `apps/web/src/app/[locale]/dashboard/page.tsx` — ボタン追加
  - `apps/web/messages/ja.json` — `event_create` セクション追加
  - `apps/web/messages/en.json` — `event_create` セクション追加
- **依存パッケージ**: 追加なし（shadcn/ui コンポーネントは既存のものを使用）

## チェックリスト

- [ ] `getPublicBars()` がバー一覧を正しく返す
- [ ] `createEventDraft` が未認証時にエラーを返す
- [ ] `createEventDraft` が `userType !== 'user'` 時にエラーを返す
- [ ] タイトル空欄でバリデーションエラーが表示される
- [ ] 説明空欄でバリデーションエラーが表示される
- [ ] バー未選択でバリデーションエラーが表示される
- [ ] 正常保存後、イベント詳細ページへリダイレクトされる
- [ ] 保存した events レコードの `status` が `draft` であること
- [ ] ダッシュボードに「イベントを作成」ボタンが表示される（userType=user のみ）
- [ ] venue_user でアクセスした場合は 404 になること
