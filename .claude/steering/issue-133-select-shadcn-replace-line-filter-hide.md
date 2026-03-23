# Issue #133: feat: Select UI を shadcn/ui に置き換え・/events 路線フィルタを非表示

## 背景

セレクトボックスがブラウザネイティブの `<select>` ラッパーを使用しており、視認性が低くタップ/クリックしにくい状態。shadcn/ui の Select コンポーネントに置き換えてUXを改善する。また /events ページの路線フィルタは UI が未整備なため非表示にする。

## 参照

- GitHub Issue: #133
- 関連ドキュメント: `docs/features/event-search.md`
- 関連ステアリング: `.claude/steering/issue-130-area-region-filter.md`（エリアフィルタ実装済み）

## 実装方針

- shadcn/ui の `Select` コンポーネント群（SelectRoot / SelectTrigger / SelectContent / SelectItem）を使用
- ネイティブ select の代わりに Radix UI ベースの accessible なドロップダウンを提供
- 路線フィルタはコード削除ではなく `{false && ...}` のような条件で非表示にする（後で有効化しやすくするため）
- `@/components/ui/select` が未インストールの場合は `npx shadcn@latest add select` で追加

## 実装ステップ

1. `apps/web/src/components/ui/select.tsx` の存在を確認し、なければ shadcn CLI で追加
2. `apps/web/src/app/[locale]/events/events-filter.tsx` を確認
   - 都道府県（エリア）フィルタの `<select>` を shadcn/ui `<Select>` に置き換え
   - 路線フィルタ（`availableLines` 等）を `{false && ...}` で非表示
3. `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` を確認
   - 会場選択の `<select>` を shadcn/ui `<Select>` に置き換え
4. 翻訳キーの追加は不要（既存のラベル文言をそのまま使用）
5. Playwright で動作確認

## 影響範囲

- `apps/web/src/app/[locale]/events/events-filter.tsx`
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
- `apps/web/src/components/ui/select.tsx`（未存在の場合は新規追加）

## チェックリスト

- [ ] `@/components/ui/select` が存在することを確認（なければ追加）
- [ ] `events-filter.tsx` のエリアフィルタが shadcn/ui Select に置き換わっている
- [ ] `events-filter.tsx` の路線フィルタが非表示になっている
- [ ] `event-edit-form.tsx` の会場選択が shadcn/ui Select に置き換わっている
- [ ] `/events` ページでフィルタが正常に動作する
- [ ] ダッシュボードのイベント編集フォームで会場選択が正常に動作する
