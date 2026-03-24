# Issue #151: イベント編集画面の改善

## 背景

- イベント作成フォームで「最寄り駅」入力欄が表示されているが、店舗選択の時点では不要
  → 最寄り駅は編集フォーム（draft 状態）でのみ入力できれば十分
- イベント作成フォームの会場セレクトボックスがブラウザネイティブ（`<select>` + `<option>`）になっており、
  高さが小さく押しづらい → shadcn/ui の `Select` コンポーネントに置き換える

## 参照

- GitHub Issue: #151
- 関連ドキュメント: `docs/features/event-creation.md`

## 実装方針

1. `event-create-form.tsx` から `nearestStation` フィールドを削除
2. `event-create-form.tsx` の会場セレクトを shadcn/ui の `Select`（`SelectTrigger` / `SelectContent` / `SelectItem`）に置き換え
3. `createEventDraft` action から `nearestStation` の読み取り・バリデーション・INSERT を削除

## 実装ステップ

1. **`apps/web/src/lib/actions/event.ts`**
   - `createEventDraft` から `nearestStation` の取得・バリデーション・INSERT を削除

2. **`apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`**
   - `import { Select } from "@/components/ui/select"` を
     `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` を含む正しいインポートに変更
   - 会場フィールドを shadcn/ui の `Select` コンポーネントに置き換え（`useState` で `orgId` を管理）
   - `nearestStation` フィールドを削除
   - `formData.set('orgId', orgId)` をフォーム送信時に追加

## 影響範囲

- `apps/web/src/lib/actions/event.ts`
- `apps/web/src/app/[locale]/dashboard/event/create/event-create-form.tsx`

## チェックリスト

- [ ] `createEventDraft` から `nearestStation` が削除された
- [ ] 作成フォームの会場セレクトが shadcn/ui の `Select` になった
- [ ] 作成フォームから `nearestStation` 入力欄が消えた
- [ ] 型エラーがない（`pnpm tsc --noEmit`）
