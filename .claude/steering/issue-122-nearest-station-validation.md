# Issue #122: nearestStation に文字数上限バリデーションを追加する

## 背景

イベント作成・編集アクションの `nearestStation` フィールドに文字数上限バリデーションが未実装。
`title`（100文字）や `description`（2000文字）は上限チェックがあるが、`nearestStation` には未設定。
他フィールドとの一貫性のために対応する（PR #121 のセルフレビューで指摘）。

## 参照

- GitHub Issue: #122
- 関連ドキュメント: `docs/features/event-creation.md`

## 実装方針

- 上限は 50 文字に設定する（Issue 本文に明記）
- サーバーサイド（actions）とフォーム（UI）の両方に制限を追加することで二重防御とする
- エラーメッセージは既存フィールドと同じパターンに合わせる

## 実装ステップ

1. `apps/web/src/lib/actions/event.ts` を確認し、`createEventDraft` と `updateEventDraft` で `nearestStation` のバリデーションを追加する
2. `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx` の `nearestStation` Input に `maxLength={50}` を追加
3. `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` の `nearestStation` Input に `maxLength={50}` を追加
4. 翻訳キーを `ja.json` / `en.json` に追加（エラーメッセージが新規の場合）

## 影響範囲

- `apps/web/src/lib/actions/event.ts`
- `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
- `apps/web/messages/ja.json` / `en.json`（エラーメッセージキー追加の場合）

## チェックリスト

- [ ] `event.ts` の `createEventDraft` に `nearestStation` 50文字バリデーション追加
- [ ] `event.ts` の `updateEventDraft` に `nearestStation` 50文字バリデーション追加
- [ ] `event-create-form.tsx` の Input に `maxLength={50}` 追加
- [ ] `event-edit-form.tsx` の Input に `maxLength={50}` 追加
- [ ] 翻訳キーの追加（必要な場合）
- [ ] Playwright で動作確認
