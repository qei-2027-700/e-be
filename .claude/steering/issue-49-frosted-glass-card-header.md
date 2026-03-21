# Issue #49: UI: フロストガラスエフェクトの実装（Card・ヘッダー）

## 背景

ダッシュボードのカードとヘッダーにフロストガラス（frosted glass）エフェクトを適用する。
AppHeader には `backdrop-blur-sm bg-background/95` が既に入っているが、背景が純白のため視覚効果がほぼ出ていない。
背景にグラデーションを追加し、CSS のみで完結する opt-in なガラスエフェクトを実装する。

## 参照

- GitHub Issue: #49
- 関連ドキュメント: なし（UIビジュアル改善）
- 適用ルール: `.claude/rules/coding-conventions.md`、`.claude/rules/mobile-first.md`

## 実装方針

- **CSS のみ**。WebGL・Canvas・SVG filter は使わない
- **既存 Card の破壊的変更なし**。`variant="glass"` を opt-in で追加
- **ライト・ダークモード両対応**（`globals.css` の `.dark .glass` で対応）
- Tailwind v4 の `@layer utilities` を使って `.glass` ユーティリティを定義する
- 将来の屈折エフェクト（`.glass-refraction`）追加時もリライト不要な設計にする

## 実装ステップ

1. **`globals.css` に `.glass` ユーティリティを追加**

   `@layer utilities` ブロックを既存の `@layer base` の後に追記する:
   ```css
   @layer utilities {
     .glass {
       background: oklch(1 0 0 / 0.65);
       backdrop-filter: blur(12px) saturate(1.5);
       -webkit-backdrop-filter: blur(12px) saturate(1.5);
       border: 1px solid oklch(1 0 0 / 0.3);
     }
     .dark .glass {
       background: oklch(0.2 0 0 / 0.65);
       border: 1px solid oklch(1 0 0 / 0.1);
     }
   }
   ```

2. **`dashboard/layout.tsx` に背景グラデーションを追加**

   現在の `bg-background` に加え、`relative` + pseudo要素でなく直接 `style` または Tailwind arbitrary で:
   ```tsx
   // before
   <div className="flex min-h-screen flex-col bg-background">
   // after（相対 div + 装飾レイヤー）
   <div className="relative flex min-h-screen flex-col bg-background">
     {/* 装飾グラデーション */}
     <div
       aria-hidden
       className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
     >
       <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[oklch(0.8_0.08_260/0.35)] blur-3xl" />
       <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-[oklch(0.85_0.06_300/0.30)] blur-3xl" />
     </div>
     <AppHeader ... />
     <div className="flex-1">{children}</div>
     <AppFooter />
   </div>
   ```
   - `fixed` + `-z-10` にすることでスクロール時も背景が固定される
   - `pointer-events-none` + `aria-hidden` でアクセシビリティに影響しない
   - ダークモードでは色が暗くなるため視認性に注意（暗い背景に暗いブラーは目立たない）
     → ダークモード用に別の値を `dark:` 修飾子で上書きする

3. **`card.tsx` に `variant="glass"` を追加**

   既存の `size` prop に加えて `variant` prop を追加する:
   ```tsx
   function Card({
     className,
     size = "default",
     variant = "default",
     ...props
   }: React.ComponentProps<"div"> & {
     size?: "default" | "sm";
     variant?: "default" | "glass";
   }) {
     return (
       <div
         data-slot="card"
         data-size={size}
         data-variant={variant}
         className={cn(
           "group/card flex flex-col gap-4 overflow-hidden rounded-xl py-4 text-sm text-card-foreground ...",
           variant === "default" && "bg-card ring-1 ring-foreground/10",
           variant === "glass" && "glass ring-0",
           className
         )}
         {...props}
       />
     )
   }
   ```
   - `glass` variant のときは `bg-card`（不透明）と `ring` を外して `.glass` クラスを付与
   - 既存の `bg-card ring-1 ring-foreground/10` は `variant="default"` のときのみ適用

4. **`app-header.tsx` の blur を強化**

   ```tsx
   // before
   <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
   // after
   <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
   ```
   - 背景グラデーション追加後に `backdrop-blur-md` でより明確なガラス感が出る
   - `bg-background/95` → `/80` に下げて背景が透けやすくする

5. **ダッシュボードページで動作確認用に1〜2枚を `variant="glass"` に変更**

   `apps/web/src/app/[locale]/dashboard/page.tsx` のカレンダーカードなど1枚に適用して視覚確認:
   ```tsx
   <Card variant="glass">
   ```

## 影響範囲

- **変更ファイル**:
  - `apps/web/src/app/globals.css`
  - `apps/web/src/app/[locale]/dashboard/layout.tsx`
  - `apps/web/src/components/ui/card.tsx`
  - `apps/web/src/components/layout/app-header.tsx`
  - `apps/web/src/app/[locale]/dashboard/page.tsx`（動作確認用）
- **新規ファイル**: なし
- **依存パッケージ追加**: なし

## チェックリスト

- [ ] `.glass` ユーティリティが `globals.css` に定義されている
- [ ] ダッシュボードレイアウトに背景グラデーションが追加されている
- [ ] `Card` に `variant="glass"` prop が追加されている
- [ ] `variant="glass"` のカードが半透明でブラーエフェクトが見える
- [ ] 既存の `variant="default"`（または variant 未指定）カードの見た目が変わっていない
- [ ] `AppHeader` の blur が強化されている
- [ ] ライトモードでガラスエフェクトが確認できる
- [ ] ダークモードで視認性が損なわれていない
- [ ] モバイル幅（375px）でレイアウトが崩れていない
- [ ] TypeScript エラーが 0 件
