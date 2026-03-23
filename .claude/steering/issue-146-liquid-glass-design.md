# Issue #146: design: リキッドグラスUIデザインへのリニューアル

## 背景

現在のデザインが白黒ベースでシンプルすぎる。
青・紫・ティール系カラーを軸に、リキッドグラス質感を全体に適用する。

## 参照

- GitHub Issue: #146
- 変更対象: `apps/web/src/app/globals.css`（メイン）
- 参考: `apps/web/src/components/ui/card.tsx`（glass variant 確認）

## 現状の把握

- `brand` = アンバー/黄橙系 `oklch(0.769 0.188 70.08)` → **青系に変更**
- `feature` = バイオレット系 `oklch(0.606 0.213 293.74)` → **維持**
- `.glass` ユーティリティは既存だが弱い → **強化**
- `primary` = 黒系 → **青系グラデーションに変更**

## カラー変更方針

### `brand` を青系に変更

```css
/* ライト */
--brand: oklch(0.55 0.22 250);        /* 鮮やかな青 */
--brand-foreground: oklch(0.985 0 0); /* 白 */

/* ダーク */
--brand: oklch(0.65 0.20 250);
--brand-foreground: oklch(0.985 0 0);
```

### `teal`（ティール）カラートークンを新規追加

```css
/* @theme inline に追加 */
--color-teal: var(--teal);
--color-teal-foreground: var(--teal-foreground);

/* :root */
--teal: oklch(0.60 0.14 185);         /* エメラルド/ティール */
--teal-foreground: oklch(0.985 0 0);

/* .dark */
--teal: oklch(0.68 0.13 185);
--teal-foreground: oklch(0.985 0 0);
```

### `primary` を青系に変更（ライト）

```css
--primary: oklch(0.55 0.22 250);      /* brand と同じ青 */
--primary-foreground: oklch(0.985 0 0);
--ring: oklch(0.55 0.22 250);
```

## リキッドグラス強化

### `.glass` ユーティリティを強化

```css
@layer utilities {
  .glass {
    background: oklch(1 0 0 / 0.72);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid oklch(1 0 0 / 0.35);
    box-shadow: 0 8px 32px oklch(0.55 0.22 250 / 0.08),
                inset 0 1px 0 oklch(1 0 0 / 0.4);
  }
  .dark .glass {
    background: oklch(0.18 0.02 250 / 0.72);
    border: 1px solid oklch(1 0 0 / 0.12);
    box-shadow: 0 8px 32px oklch(0 0 0 / 0.3),
                inset 0 1px 0 oklch(1 0 0 / 0.08);
  }
}
```

### ページ背景グラデーション

`body` にグラデーション背景を追加：

```css
body {
  @apply text-foreground;
  background: linear-gradient(
    135deg,
    oklch(0.97 0.02 250) 0%,
    oklch(0.98 0.01 293) 50%,
    oklch(0.97 0.02 185) 100%
  );
  min-height: 100vh;
}
.dark body {
  background: linear-gradient(
    135deg,
    oklch(0.12 0.03 250) 0%,
    oklch(0.13 0.02 293) 50%,
    oklch(0.12 0.02 185) 100%
  );
}
```

## ヘッダーのガラス強化

`AppHeader`・`PublicHeader`・`NavBar` の既存 `bg-background/80 backdrop-blur-md` を
`glass` クラスに置き換える。

```tsx
// before
className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md"

// after
className="sticky top-0 z-40 border-b glass"
```

対象ファイル:
- `apps/web/src/components/layout/app-header.tsx`
- `apps/web/src/components/layout/public-header.tsx`
- `apps/web/src/components/lp/nav-bar.tsx`

## 実装ステップ

1. `globals.css` を更新
   - `brand` を青系に変更（ライト・ダーク両方）
   - `primary` / `ring` を青系に変更
   - `teal` カラートークンを追加（`@theme inline` + `:root` + `.dark`）
   - `.glass` ユーティリティを強化
   - `body` 背景グラデーションを追加

2. ヘッダー3ファイルの `bg-background/80 backdrop-blur-md` を `glass` に変更

## 受け入れ条件

- [ ] `brand` が青系になっている
- [ ] `teal` カラートークンが追加されている
- [ ] ページ背景に青〜紫〜ティールの薄いグラデーションがある
- [ ] ヘッダーがリキッドグラス質感になっている
- [ ] ダークモードで崩れない
- [ ] TypeScript エラーなし

## 影響範囲

- `apps/web/src/app/globals.css`
- `apps/web/src/components/layout/app-header.tsx`
- `apps/web/src/components/layout/public-header.tsx`
- `apps/web/src/components/lp/nav-bar.tsx`
