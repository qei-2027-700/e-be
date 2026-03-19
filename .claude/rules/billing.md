---
description: 課金・プラン設計 — canUseFeature・Stripe・スキーマ予約
paths:
  - "apps/**"
  - "packages/db/**"
---

- プランは `'free' | 'premium'` の2種類を前提とする（将来拡張可）
- **機能制限の判定は必ず `canUseFeature(user, feature)` を通す**。コンポーネントや API に直接 `user.plan === 'premium'` を書かない
- DB スキーマの `users` / `organizations` には `stripe_customer_id`・`plan`・`plan_expires_at` 列を最初から含める
- 課金処理は **Stripe**（Vercel Marketplace）を使う想定。導入前でも列だけ先に用意する
- Stripe Webhook で `plan` 列を更新する設計にする（UI から直接 plan を書き換えない）
