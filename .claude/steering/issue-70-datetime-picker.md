# Issue #70: ux: イベント編集フォームの日時入力をカレンダーピッカーに変更

## 背景

現在 `type="datetime-local"` のネイティブ input を使用しているため、ブラウザ依存でUIがバラバラで操作しにくい。shadcn/ui の Calendar + Popover で日付を、select で時刻を選択できるピッカーに変更することで、一貫したUIを提供する。

## 参照

- GitHub Issue: #70
- 関連ドキュメント: `docs/features/event-creation.md`
- アーキテクチャ: `docs/architecture/decisions.md`

## 実装方針

- shadcn/ui の Calendar（react-day-picker ベース）と Popover を使った日付選択
- 時刻は時・分を select で選択（分は 15 分刻み: 0/15/30/45）
- 内部で ISO 文字列に変換して hidden input 経由で FormData に渡す（Server Action の変更は不要）
- `DateTimePicker` コンポーネントを再利用可能な形で実装し、開始・終了日時の両方に適用

## 実装ステップ

1. shadcn/ui の calendar・popover コンポーネントを追加
   ```bash
   cd apps/web && npx shadcn@latest add calendar popover
   ```
2. `apps/web/src/components/ui/date-time-picker.tsx` を新規作成
   - Props: `value?: string` (ISO文字列)、`onChange?: (value: string) => void`、`name: string`（hidden input 用）、`placeholder?: string`
   - 日付: Popover + Calendar でカレンダー表示
   - 時刻: 時（0〜23）・分（0/15/30/45）を select で選択
   - 内部で日付+時刻を組み合わせて ISO 文字列を生成
   - 未選択時は空文字列
3. `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` の `type="datetime-local"` input を `DateTimePicker` に差し替え
4. 翻訳キーを `ja.json` と `en.json` の両方に追加（必要な場合）

## 影響範囲

- 新規作成: `apps/web/src/components/ui/date-time-picker.tsx`
- 変更: `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
- 新規追加: `apps/web/src/components/ui/calendar.tsx`、`apps/web/src/components/ui/popover.tsx`（shadcn add で生成）
- 依存パッケージ: `react-day-picker`（shadcn calendar の依存として追加される）

## チェックリスト

- [ ] `npx shadcn@latest add calendar popover` を実行してコンポーネント追加
- [ ] `DateTimePicker` コンポーネントを作成（日付: Calendar+Popover、時刻: select）
- [ ] 開始日時・終了日時の両フィールドを `DateTimePicker` に差し替え
- [ ] 未選択時に空文字列として扱われること確認
- [ ] 既存の ISO 文字列が正しく初期値として表示されること確認
- [ ] 分の選択肢が 0/15/30/45 であること確認
- [ ] Playwright で画面確認
