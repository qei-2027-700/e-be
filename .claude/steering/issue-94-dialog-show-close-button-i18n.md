# Issue #94: chore: Dialog の showCloseButton テキストを i18n 対応する

## 背景

`apps/web/src/components/ui/dialog.tsx` の `DialogFooter` と `DialogContent` に
`showCloseButton` オプションがあり、閉じるボタン/テキストがハードコード（"Close"）になっている。
現在 `showCloseButton` の使用箇所はないが、将来の利用に備えて i18n 対応しておく。

## 参照

- GitHub Issue: #94
- 翻訳ファイル: `apps/web/messages/ja.json`, `apps/web/messages/en.json`
- 関連ステアリング: `.claude/steering/i18n.md`

## 実装方針

`DialogFooter` の `showCloseButton` で表示される "Close" テキストを `closeLabel` prop で
受け取れるようにする（デフォルト値なし、呼び出し元が `useTranslations` 経由で渡す）。

`DialogContent` の `showCloseButton` にある `<span className="sr-only">Close</span>` も
同様に `closeSrLabel` prop で受け取れるようにする。

翻訳キーは `common.dialog.close` に追加する。

## 実装ステップ

1. `apps/web/messages/ja.json` の `common` に翻訳キー追加
   ```json
   "common": {
     "dialog": {
       "close": "閉じる"
     },
     "confirmDialog": { ... }
   }
   ```

2. `apps/web/messages/en.json` の `common` に翻訳キー追加
   ```json
   "common": {
     "dialog": {
       "close": "Close"
     },
     ...
   }
   ```

3. `apps/web/src/components/ui/dialog.tsx` を修正
   - `DialogContent` に `closeSrLabel?: string` prop を追加
     - `<span className="sr-only">{closeSrLabel ?? "Close"}</span>` に変更
   - `DialogFooter` に `closeLabel?: string` prop を追加
     - `{showCloseButton && closeLabel && (...)}`、または `closeLabel` があるときのみ閉じるボタンを描画

   **設計方針**: ハードコードの "Close" を prop に置き換え、呼び出し元が翻訳済みテキストを渡す。
   デフォルト値は設けず、`closeLabel` が渡された場合のみボタンを表示することで
   「翻訳なし=表示なし」を強制する（将来の i18n 漏れを防ぐ）。

## 影響範囲

- `apps/web/src/components/ui/dialog.tsx`（DialogContent・DialogFooter の型定義と実装）
- `apps/web/messages/ja.json`
- `apps/web/messages/en.json`
- 現在 `showCloseButton={true}` の使用箇所はないため既存 UI への影響なし

## チェックリスト

- [ ] `ja.json` に `common.dialog.close` を追加
- [ ] `en.json` に `common.dialog.close` を追加
- [ ] `DialogContent` の `<span className="sr-only">Close</span>` を prop 経由に変更
- [ ] `DialogFooter` の "Close" テキストを `closeLabel` prop 経由に変更
- [ ] TypeScript 型エラーなし（`pnpm --filter web tsc --noEmit`）
- [ ] `showCloseButton` の既存使用箇所を確認（現状なし）
