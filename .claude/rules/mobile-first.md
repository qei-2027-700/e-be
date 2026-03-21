---
description: モバイルファースト — Tailwind レスポンシブ・タップターゲット
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/mobile/**/*.tsx"
---

- **モバイルファーストで実装する**。Tailwind のレスポンシブ修飾子はモバイルが基底
  - ✅ `text-sm md:text-base` — モバイル小、PC 大
  - ❌ `text-base md:text-sm` — これはモバイルファーストではない
- レイアウトは `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` のように積み上げる
- タップターゲットは最低 44px（`min-h-11` 相当）を確保する
- hover 効果はタッチデバイスで意図せず残らないよう `@media (hover: hover)` を意識する
  - shadcn/ui のコンポーネントはこれを考慮済み
- このプロジェクトは Web (Next.js) と Mobile (Expo) の両方で展開する
