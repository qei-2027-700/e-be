---
description: コーディング規約 — shadcn/ui・Server Components・Tailwind
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
  - "apps/mobile/**/*.tsx"
---

- コンポーネントは shadcn/ui を優先して使う（素の HTML + Tailwind で自作しない）
- `'use client'` は必要最小限。Server Components をデフォルトとする
- TailwindCSS クラスは可読性重視（1行に詰め込みすぎない）
- clickableな箇所は、hover時に何かしらのanimationを実装する
- 不自然ではない程度に、iphoneが採用しているリキッドグラスのUIデザインを実装する（例: frosted glass風の半透明背景、滑らかなアニメーション、丸みのある角など）
