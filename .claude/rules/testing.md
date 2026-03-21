---
description: テストアカウント・開発用シード — apps/web 限定
paths:
  - "apps/web/**"
---

## 検証用テストアカウント

サインインページにテストアカウントのパネルが表示される（`NEXT_PUBLIC_BYPASS_AUTH=true` が設定されている場合のみ）。

| 種別 | メール | パスワード | userType |
|------|-------|-----------|----------|
| 一般ユーザー（イベンター） | `test-user@e-be.internal` | `testpass2026` | `user` |
| 事業者（店舗管理） | `test-venue@e-be.internal` | `testpass2026` | `venue_user` |

事業者アカウントは「テスト株式会社 / テストバー」に owner として紐付き済み。

アカウントを再作成・追加する場合: `pnpm seed:test`（冪等、スクリプト: `apps/web/scripts/seed-test-accounts.mjs`）
