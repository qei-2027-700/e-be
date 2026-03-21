# Issue #67: API実行後のトースターコンポーネントの実装

## 背景

API（Server Action）実行後、ユーザーに成功・失敗フィードバックを画面下部のトースト通知で伝える。
現状、エラーは `<p className="text-destructive">` でインライン表示するか、単に無視されており、ユーザー体験が一貫していない。

## 参照

- GitHub Issue: #67
- 関連ドキュメント: なし（汎用 UI インフラ）
- 対象コンポーネント（現行の Action 使用箇所）:
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/participation-button.tsx`
  - `apps/web/src/app/[locale]/admin/applications/review-actions.tsx`
  - `apps/web/src/app/[locale]/dashboard/apply/apply-form.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`

## 実装方針

- **ライブラリ**: `sonner`（shadcn/ui の推奨 toast ライブラリ）を使用する
  - shadcn CLI で `npx shadcn@latest add toast` ではなく `sonner` コンポーネントとして追加
  - `sonner` は shadcn v4 の標準的な選択肢で、プロジェクト既存の shadcn/ui と親和性が高い
- **配置**: `apps/web/src/app/[locale]/layout.tsx`（またはルートレイアウト）に `<Toaster>` を追加
- **使用方法**: クライアントコンポーネント内で `import { toast } from 'sonner'` して `toast.success()` / `toast.error()` を呼ぶ
- **対象**: `useTransition` や `useActionState` で Server Action を呼んでいるコンポーネントすべて

## 実装ステップ

1. **sonner のインストール**
   ```bash
   cd apps/web
   pnpm add sonner
   # または shadcn CLI で追加
   npx shadcn@latest add sonner
   ```

2. **`<Toaster>` をルートレイアウトに追加**
   - `apps/web/src/app/[locale]/layout.tsx` を確認し、`</body>` 直前に `<Toaster />` を追加
   - `position="bottom-center"` を指定（Issue の「画面下部」要件）

3. **`participation-button.tsx` にトーストを追加**
   - `handleJoin` 成功時: `toast.success(t('join_success'))`
   - `handleJoin` エラー時: `toast.error(t('join_error'))`（`already_registered`, `full_capacity`, `event_ended` 等のエラーコードをマップ）
   - `handleCancel` 成功時: `toast.success(t('cancel_success'))`
   - `handleCancel` エラー時: `toast.error(t('cancel_error'))`

4. **`review-actions.tsx` にトーストを追加**
   - `useActionState` の戻り値を監視し、成功時・エラー時にトーストを表示
   - `useEffect(() => { if (approveState?.success) toast.success(...) }, [approveState])` パターンを使用

5. **`apply-form.tsx` にトーストを追加**
   - 成功時 → `toast.success(t('apply.success_title'))`（現在のインライン表示と併用 or 置き換え）

6. **`event-create-form.tsx` / `event-edit-form.tsx` にトーストを追加**
   - 成功時・エラー時にトーストを表示

7. **翻訳キーの追加**
   - `apps/web/messages/ja.json` と `en.json` に `toast` キーを追加:
     ```json
     "toast": {
       "join_success": "イベントに参加しました",
       "cancel_success": "参加をキャンセルしました",
       "already_registered": "すでに参加済みです",
       "full_capacity": "定員に達しています",
       "event_ended": "開催済みのイベントです",
       "error_generic": "エラーが発生しました。もう一度お試しください。",
       "approve_success": "申請を承認しました",
       "reject_success": "申請を却下しました",
       "apply_success": "申請を送信しました"
     }
     ```

## 影響範囲

- 新規追加: `sonner` パッケージ
- 変更ファイル:
  - `apps/web/src/app/[locale]/layout.tsx` — `<Toaster>` 追加
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/participation-button.tsx`
  - `apps/web/src/app/[locale]/admin/applications/review-actions.tsx`
  - `apps/web/src/app/[locale]/dashboard/apply/apply-form.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
  - `apps/web/messages/ja.json`
  - `apps/web/messages/en.json`

## チェックリスト

- [ ] `sonner` がインストールされている
- [ ] `<Toaster position="bottom-center" />` がルートレイアウトに配置されている
- [ ] `participation-button.tsx`: 参加成功・キャンセル成功・各エラーでトーストが出る
- [ ] `review-actions.tsx`: 承認・却下の成功/エラーでトーストが出る
- [ ] `apply-form.tsx`: 申請送信成功/エラーでトーストが出る
- [ ] `event-create-form.tsx` / `event-edit-form.tsx`: 作成・編集の成功/エラーでトーストが出る
- [ ] 翻訳キーが `ja.json` と `en.json` の両方に追加されている
- [ ] Playwright で各フローのトースト表示を確認済み
