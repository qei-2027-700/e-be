# データベース設計

## 主要エンティティ

### users（ユーザー）

Supabase Auth と連携。`userType` で役割を区別します。

| カラム | 型 | 説明 |
|------|---|------|
| id | uuid | Supabase Auth UID |
| email | text | メールアドレス |
| userType | enum | `general` / `operator` / `admin` |
| created_at | timestamptz | 作成日時（UTC） |

### companies（事業者）

店舗を束ねる上位エンティティ。

| カラム | 型 | 説明 |
|------|---|------|
| id | uuid | PK |
| name | text | 事業者名 |
| owner_id | uuid | 代表ユーザー |
| created_at | timestamptz | 作成日時（UTC） |

### venues（店舗）

1事業者が複数店舗を持てる構造。

| カラム | 型 | 説明 |
|------|---|------|
| id | uuid | PK |
| company_id | uuid | 所属事業者 |
| name | text | 店舗名 |
| address | text | 住所 |
| deleted_at | timestamptz | 論理削除日時 |

## 設計上の判断

### ステータスは計算で導出する

`status` カラムは持たず、`start_at` / `end_at` から導出します。

```ts
// ❌ DB に status を持つ
{ status: 'ongoing' }

// ✅ 計算で導出
const isOngoing = event.start_at <= now && now <= event.end_at
```

### 論理削除

重要なデータ（venues, events）は物理削除せず `deleted_at IS NULL` でフィルタします。

```sql
-- 有効な店舗のみ取得
SELECT * FROM venues WHERE deleted_at IS NULL;
```
