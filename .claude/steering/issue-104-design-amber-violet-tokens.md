# Issue #104: design: デザイントークンに Amber・Violet の 2 色を追加する

## 背景

現在の `globals.css` には `--brand`（琥珀系）と `--feature`（紫系）の semantic トークンが既に存在するが、
Issue #108 で `--brand` / `--feature` にリネームした背景もあり、今回はさらに汎用的な色名トークン
`--amber` と `--violet` を追加することで、バー・ナイトライフのブランドイメージに合う配色を
デザインシステムに正式に取り込む。

## 参照

- GitHub Issue: #104
- 関連ドキュメント: なし（docs/features/ に該当なし）
- 既存スタイル: `apps/web/src/app/globals.css`

## 実装方針

Tailwind v4 の `@theme inline` ブロックと `:root` / `.dark` セレクターに、
`--amber` / `--amber-foreground` および `--violet` / `--violet-foreground` を追加する。

- oklch カラー空間を使用（既存トークンと一貫性を保つ）
- Amber: 暖色・バーの温かみ（hue ~70付近、既存 `--brand` を参考に独立したトークンとして追加）
- Violet: ナイトライフ・アクセント（hue ~280-295付近、既存 `--feature` を参考に独立したトークンとして追加）
- ライト・ダーク両モード対応
- 前景色（`-foreground`）はコントラスト比 4.5:1 以上を確保

## 実装ステップ

1. `apps/web/src/app/globals.css` の `@theme inline` ブロックに以下を追加
   ```css
   --color-amber: var(--amber);
   --color-amber-foreground: var(--amber-foreground);
   --color-violet: var(--violet);
   --color-violet-foreground: var(--violet-foreground);
   ```

2. `:root` セレクターに Amber・Violet のライトモード値を追加
   ```css
   --amber: oklch(0.769 0.188 70.08);
   --amber-foreground: oklch(0.2 0.05 70);
   --violet: oklch(0.606 0.213 293.74);
   --violet-foreground: oklch(0.985 0 0);
   ```

3. `.dark` セレクターにダークモード値を追加
   ```css
   --amber: oklch(0.75 0.17 68);
   --amber-foreground: oklch(0.15 0.04 68);
   --violet: oklch(0.65 0.22 293);
   --violet-foreground: oklch(0.985 0 0);
   ```

4. 動作確認: `bg-amber` / `text-amber-foreground` / `bg-violet` / `text-violet-foreground` が Tailwind で使えることを確認

## 影響範囲

- `apps/web/src/app/globals.css` のみ変更
- 他ファイルへの影響なし（新規トークン追加のみ）

## チェックリスト

- [ ] `@theme inline` に `--color-amber` / `--color-amber-foreground` / `--color-violet` / `--color-violet-foreground` を追加
- [ ] `:root` に Amber・Violet のライトモード CSS 変数を追加
- [ ] `.dark` に Amber・Violet のダークモード CSS 変数を追加
- [ ] `bg-amber` / `text-amber-foreground` クラスが使える
- [ ] `bg-violet` / `text-violet-foreground` クラスが使える
- [ ] ライト・ダーク双方で視認性が確保されている
