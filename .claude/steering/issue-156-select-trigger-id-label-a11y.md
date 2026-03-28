# Issue #156: SelectTrigger に id を追加して Label との紐付けを修正

## 背景

`event-create-form.tsx` の `<Label htmlFor="orgId">` に対して
`<SelectTrigger>` に `id` が設定されておらず、Label クリック時にフォーカスが当たらない。
同様の問題が `event-edit-form.tsx` にも存在する（Label に htmlFor なし、SelectTrigger に id なし）。

## 修正対象

### 1. event-create-form.tsx
- `<Label htmlFor="orgId">` は既にある
- `<SelectTrigger className="w-full" size="lg">` に `id="orgId"` を追加するだけ

### 2. event-edit-form.tsx
- `<Label>` に `htmlFor="orgId"` を追加
- `<SelectTrigger className="w-full" size="lg">` に `id="orgId"` を追加

## チェックリスト

- [ ] create-form の SelectTrigger に `id="orgId"` が追加されている
- [ ] edit-form の Label に `htmlFor="orgId"` が追加されている
- [ ] edit-form の SelectTrigger に `id="orgId"` が追加されている
- [ ] Label クリックで Select がフォーカス・開くことを確認
