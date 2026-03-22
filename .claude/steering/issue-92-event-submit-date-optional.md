# Issue #92: feat: イベント申請フロー改善（日付任意化・警告表示・確認Modal）

## 背景

イベント申請時、バーと日程を後から調整するユースケースを許容するため、`startAt` / `endAt` なしでも申請できるように変更する。日付未設定の場合は警告文を表示し、申請ボタン押下時に確認 Dialog を表示する。

## 参照

- GitHub Issue: #92
- 関連ドキュメント: `docs/features/event-creation.md`, `docs/features/event-approval.md`

## 実装方針

- フロントエンド: 申請ボタンの `canSubmit` 条件から `hasDatetime` を除去（`hasVenue && !isDatetimeInvalid` のみに変更）
- 日付未設定時は警告文を表示（ボタンは活性化）
- 申請ボタン押下 → ConfirmDialog 表示 → 「申請する」クリックで `submitEvent` 実行
- ConfirmDialog の description にイベントタイトル・会場名・日時（未設定なら「未設定」）を表示
- サーバーサイド: `submitEvent` の `datetime_required` チェックを削除
- 公開（`publishEvent`）は日付必須のまま変更しない

## 実装ステップ

1. **`apps/web/src/lib/actions/event.ts`**
   - `submitEvent` 関数の `if (!target.startAt || !target.endAt) return { error: 'datetime_required' };` を削除
   - `past_date` / `invalid_range` / `conflict` チェックは日時が存在する場合のみ行う（条件分岐を追加）

2. **`apps/web/messages/ja.json`**
   - `event_edit` セクションに追加:
     - `warning_no_datetime`: 「日程が未設定です。申請後にバー側と調整してください」
     - `submit_confirm_title`: 「申請内容の確認」
     - `submit_confirm_venue`: 「会場」
     - `submit_confirm_datetime`: 「日時」
     - `submit_confirm_not_set`: 「未設定」
     - `submit_confirm_label`: 「申請する」

3. **`apps/web/messages/en.json`**
   - 同キーを英語で追加

4. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`**
   - `canSubmit` 条件から `hasDatetime` を除去 → `const canSubmit = hasVenue && !isDatetimeInvalid;`
   - `confirmOpen` state を追加（ConfirmDialog の開閉制御）
   - 申請ボタンの `onClick` を `() => setConfirmOpen(true)` に変更
   - 日付未設定時の警告文を表示（`!hasDatetime` の場合）
   - `ConfirmDialog` を組み込む:
     - `title`: `t("submit_confirm_title")`
     - `description`: 会場名・日時の詳細をリスト表示
     - `confirmLabel`: `t("submit_confirm_label")`
     - `onConfirm`: `handleSubmit`（既存の申請処理）
     - `isPending`: `isPending`
   - EventData に `title` フィールドがあるが `event.title` を使い、未設定は表示なし

## 影響範囲

- `apps/web/src/lib/actions/event.ts`（submitEvent の datetime_required チェック削除）
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`（UI変更）
- `apps/web/messages/ja.json` / `en.json`（翻訳キー追加）

## チェックリスト

- [ ] 日付未設定でも「申請する」ボタンが活性化する
- [ ] 日付未設定時に警告文が表示される
- [ ] 申請ボタン押下で ConfirmDialog が開く
- [ ] ConfirmDialog に会場名・日時が表示される（未設定は「未設定」）
- [ ] 「申請する」確認で申請処理が実行され、ダッシュボードへ遷移する
- [ ] 日付が `end_at < start_at` の場合は引き続き disabled + エラー表示
- [ ] 公開（hasPermission=true）は日付必須のまま変更なし
- [ ] `submitEvent` サーバーアクションの `datetime_required` チェックが削除されている
- [ ] ja.json / en.json 両方に翻訳キーが追加されている
