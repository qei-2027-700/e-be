# データベーススキーマ実装計画 (Issue #2)

## 方針
- Drizzle ORM を採用し、TypeScript による型安全なデータアクセスを実現する。
- 物理削除（`DELETE`）を使わず、`deleted_at` による論理削除（ソフトデリート）を全テーブルで採用する。
- タイムゾーンは UTC で統一し、DB に保存する。

---

## 1. テーブル構成

### 共通カラム (mixin)
- `id`: uuid (primary key)
- `createdAt`: timestamp (not null, default now)
- `updatedAt`: timestamp (not null, default now)
- `deletedAt`: timestamp (nullable)

### テナント階層
```
companies（法人）
└── organizations（店舗） ← brand フィールドでブランド区別
    └── organization_members
```

---

### `users` (ユーザー)
- `id`: uuid
- `email`: text (unique, not null)
- `name`: text (nullable)
- `image`: text (nullable)
- `userType`: text (enum: `'user' | 'venue_user' | 'system_user'`, default: `'user'`)

### `companies` (法人) ← **新規**
- `id`: uuid
- `name`: text (not null、法人名)
- `slug`: text (unique, not null)
- `stripeCustomerId`: text
- `plan`: text (enum: `'free' | 'premium'`)
- `planExpiresAt`: timestamp

### `organizations` (店舗)
- `id`: uuid
- `companyId`: uuid (FK -> companies.id) ← **追加**
- `brand`: text (nullable) ← **追加**（複数ブランドを持つ場合に使用）
- `slug`: text (unique, not null)
- `name`: text (not null)
- `description`: text
- `address`: text
- `imageColor`: text (HEX)
- `iconUrl`: text
- `coverImageUrl`: text

### `organization_members` (店舗メンバーシップ)
- `id`: uuid
- `orgId`: uuid (FK -> organizations.id)
- `userId`: uuid (FK -> users.id)
- `role`: text (enum: `'owner' | 'member'`)
- **制約**: `UNIQUE (org_id) WHERE role = 'owner'`（1店舗に owner は1人）

### `operator_applications` (事業者登録申請) ← **新規**
- `id`: uuid
- `userId`: uuid (FK -> users.id)
- `status`: text (enum: `'pending' | 'approved' | 'rejected'`)
- `companyName`: text (not null、法人名、最大100文字)
- `orgName`: text (not null、店舗名、最大50文字)
- `orgSlug`: text (not null、英数字・ハイフンのみ、最大50文字)
- `brand`: text (nullable)
- `description`: text (nullable)
- `address`: text (nullable)
- `reviewedBy`: uuid (FK -> users.id, nullable)
- `reviewedAt`: timestamp (nullable)
- `reviewNote`: text (nullable、却下理由等)

### `fc_relationships` (FC店舗閲覧権限) ← **新規**
- `id`: uuid
- `franchisorOrgId`: uuid (FK -> organizations.id、本部店舗)
- `franchiseeOrgId`: uuid (FK -> organizations.id、FC加盟店)
- `grantedBy`: uuid (FK -> users.id)
- `grantedAt`: timestamp
- `revokedAt`: timestamp (nullable)

### `events` (イベント)
- `id`: uuid
- `orgId`: uuid (FK -> organizations.id)
- `userId`: uuid (FK -> users.id) — 作成者
- `status`: text (enum: `'draft' | 'pending' | 'published' | 'cancelled' | 'rejected'`)
- `title`: text
- `description`: text
- `startAt`: timestamp
- `endAt`: timestamp
- `maxParticipants`: integer
- `location`: text

### `bar_host_permissions` (主催者許可)
- `id`: uuid
- `barId`: uuid (FK -> organizations.id)
- `userId`: uuid (FK -> users.id)
- `grantedAt`: timestamp
- `revokedAt`: timestamp
- `grantedBy`: uuid (FK -> users.id)

### `bar_blocks` (店舗利用不可枠)
- `id`: uuid
- `barId`: uuid (FK -> organizations.id)
- `startAt`: timestamp
- `endAt`: timestamp
- `reason`: text

### `coupons` (クーポン定義)
- `id`: uuid
- `orgId`: uuid (FK -> organizations.id)
- `title`: text
- `description`: text
- `discountAmount`: integer
- `expiresAt`: timestamp

### `user_coupons` (ユーザー保持クーポン)
- `id`: uuid
- `userId`: uuid (FK -> users.id)
- `couponId`: uuid (FK -> coupons.id)
- `token`: uuid (QRコード化用)
- `usedAt`: timestamp

### `audit_logs` (監査ログ)
- `id`: uuid
- `userId`: uuid (FK -> users.id)
- `orgId`: uuid (FK -> organizations.id, nullable)
- `action`: text (e.g., `'event_approved'`, `'ownership_transferred'`)
- `entityType`: text (e.g., `'event'`, `'member'`)
- `entityId`: uuid
- `payload`: jsonb

### `notifications` (通知)
- `id`: uuid
- `userId`: uuid (FK -> users.id)
- `type`: text
- `title`: text
- `body`: text
- `readAt`: timestamp
- `payload`: jsonb

---

## 2. ロジックの実装

### `packages/db/src/event-transitions.ts`
- `canTransition(from, to, role)`: 権限に応じた遷移可否判定。
- `resolveStatus(event)`: 時刻を考慮した `ongoing` / `completed` 導出。

### `packages/db/src/plans.ts`
- `canUseFeature(plan, feature)`: プランに応じた機能制限。

### `packages/db/src/notification-types.ts`
- 通知タイプの定数と型定義。

---

## 3. 実装ステップ

1. `packages/db` ディレクトリ作成・初期化
2. Drizzle ORM / Supabase / Postgres 依存関係の追加
3. スキーマ定義 (`src/schema.ts`)
4. ユーティリティの実装 (`src/plans.ts`, `src/event-transitions.ts` 等)
5. `index.ts` から export
