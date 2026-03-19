# 課金・プレミアムプラン設計

## 方針

今すぐ実装しないが、後から導入しやすい構成にする。
「今やること（設計の予約）」と「後でやること（Stripe 実装）」を分ける。

---

## 今やること — DB スキーマの予約

`packages/db` 実装時に以下の列を最初から含める。

```ts
// users テーブル
stripeCustomerId: text('stripe_customer_id'),
plan: text('plan', { enum: ['free', 'premium'] }).default('free').notNull(),
planExpiresAt: timestamp('plan_expires_at'),

// organizations テーブル（組織単位課金も考慮）
stripeCustomerId: text('stripe_customer_id'),
plan: text('plan', { enum: ['free', 'premium'] }).default('free').notNull(),
planExpiresAt: timestamp('plan_expires_at'),
```

---

## 今やること — 機能制限ユーティリティ

```ts
// packages/db/src/plans.ts

export type Plan = 'free' | 'premium'

export type Feature =
  | 'fc_request'      // FCリクエスト送信
  | 'ai_export'       // AI分析テキストエクスポート
  | 'analytics'       // 詳細分析ダッシュボード
  | 'multi_store'     // 複数店舗管理（N店舗以上）

const PREMIUM_ONLY: Feature[] = ['fc_request', 'ai_export', 'analytics']

export function canUseFeature(plan: Plan, feature: Feature): boolean {
  if (plan === 'premium') return true
  return !PREMIUM_ONLY.includes(feature)
}
```

**使い方（Server Action / Route Handler）:**
```ts
import { canUseFeature } from '@e-be/db/plans'

if (!canUseFeature(user.plan, 'ai_export')) {
  return { error: 'UPGRADE_REQUIRED' }
}
```

**使い方（UI）:**
```tsx
{!canUseFeature(user.plan, 'fc_request') && (
  <UpgradeBadge />  // プレミアム誘導UI
)}
```

---

## 後でやること — Stripe 導入

### 1. Vercel Marketplace からインストール

```bash
vercel integration add stripe
# → STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY が自動注入される
```

### 2. Webhook エンドポイント

```ts
// app/api/stripe/webhook/route.ts
// checkout.session.completed → user.plan = 'premium' に更新
// customer.subscription.deleted → user.plan = 'free' に更新
```

### 3. Checkout セッション作成

```ts
// app/api/stripe/checkout/route.ts
// Stripe Checkout Session を作成して URL を返す
```

### 4. 料金ページ

```
app/[locale]/pricing/page.tsx
```

---

## プラン別機能比較（案）

| 機能 | Free | Premium |
|------|------|---------|
| イベント作成・参加 | ✅ | ✅ |
| クーポン発行 | ✅ | ✅ |
| FCリクエスト送信 | ❌ | ✅ |
| AI分析エクスポート | ❌ | ✅ |
| 詳細分析ダッシュボード | ❌ | ✅ |

---

## チェックリスト（DB スキーマ実装時）

- [ ] `users.stripe_customer_id` / `users.plan` / `users.plan_expires_at` を追加
- [ ] `organizations.stripe_customer_id` / `organizations.plan` を追加
- [ ] `packages/db/src/plans.ts` に `canUseFeature()` を実装
- [ ] Web・Mobile 両方から `canUseFeature()` をインポートして使う
