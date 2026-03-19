---
description: UI・インタラクション — hover/active・cursor・アニメーション
paths:
  - "apps/web/src/**/*.tsx"
  - "apps/web/src/**/*.ts"
---

- クリック・hover 可能な要素（Button、Card、Link 等）には必ず **hover/active の視覚的フィードバック** を付ける
  - 例: `transition-all duration-200 hover:scale-105 hover:shadow-md`
  - 例: `hover:-translate-y-0.5 hover:bg-muted/50`
- クリッカブルな要素（Button、Card、Link、badge 等）には **`cursor-pointer` を必須** とする
- アニメーションは `duration-200` を基本とし、過剰にしない
