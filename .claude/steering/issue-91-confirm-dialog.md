# Issue #91: feat: 汎用 ConfirmDialog コンポーネントの実装

## 背景

複数箇所（イベント申請確認・削除確認など）で共通して使える汎用の確認 Dialog コンポーネントが必要。
現状は専用の確認 Dialog がなく、各画面で個別に対応している。

## 参照

- GitHub Issue: #91
- 関連ドキュメント: docs/features/event-creation.md

## 実装方針

- shadcn/ui の `Dialog`（AlertDialog ではなく）をベースに実装
  - AlertDialog より柔軟なコンテンツ（ReactNode description）に対応するため
- `variant="destructive"` で確認ボタンを赤色表示（削除確認など）
- `isPending` でローディングスピナーを表示
- Props 設計はシンプルに保ち、汎用性を確保する

## 実装ステップ

1. shadcn/ui の Dialog コンポーネントを追加
   ```bash
   npx shadcn@latest add dialog --cwd apps/web
   ```

2. `apps/web/src/components/ui/confirm-dialog.tsx` を新規作成
   - Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `confirmLabel?`, `cancelLabel?`, `variant?`, `isPending?`
   - `variant="destructive"` 時は確認ボタンに `variant="destructive"` を適用
   - `isPending` 時は確認ボタンにスピナーを表示し disabled にする

3. i18n 対応（翻訳キー追加）
   - `apps/web/messages/ja.json` と `apps/web/messages/en.json` に共通テキストのキーを追加
   - デフォルトラベル（「確認」「キャンセル」/ "Confirm" "Cancel"）を翻訳で管理

## 影響範囲

- **新規作成**:
  - `apps/web/src/components/ui/confirm-dialog.tsx`
  - `apps/web/src/components/ui/dialog.tsx`（shadcn/ui インストールにより生成）
- **変更**:
  - `apps/web/messages/ja.json`（翻訳キー追加）
  - `apps/web/messages/en.json`（翻訳キー追加）

## チェックリスト

- [ ] `apps/web/src/components/ui/dialog.tsx` が存在する（shadcn/ui add dialog 実行済み）
- [ ] `confirm-dialog.tsx` が実装されている
- [ ] `variant="default"` と `variant="destructive"` の両方が動作する
- [ ] `isPending` 時にスピナー表示・ボタン無効化が機能する
- [ ] キャンセルボタンが `onOpenChange(false)` を呼ぶ
- [ ] `description` に ReactNode を渡せる
- [ ] `ja.json` / `en.json` に翻訳キーが追加されている
