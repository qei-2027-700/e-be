# 認証・ロール制御

## 背景

Supabase Auth による認証は完了済み（Issue #3）。次のステップとして：
- 認証状態によるページアクセス制御
- ユーザー種別（userType）と組織ロールによる表示制御
- 組織コンテキストに応じた UI の出し分け

## 参照

- `docs/architecture/decisions.md` #11（ユーザー種別とロール設計）
- `docs/architecture/decisions.md` #12（主催者許可システム）
- `docs/architecture/decisions.md` #13（owner 権限移譲）
- `docs/architecture/decisions.md` #14（事業者申請フロー）
- `.claude/steering/db-schema.md`（テーブル設計）

## 設計方針

### ユーザー種別（userType） — users テーブルで管理

| userType | 説明 | 組織作成 |
|----------|------|---------|
| `user` | 一般利用者。デフォルト値 | ✗（申請フロー経由） |
| `venue_user` | 承認済み店舗事業者 | ✗（管理者が承認時に作成） |
| `system_user` | システム管理者 | ○（管理者画面から直接作成） |

### 組織内ロール（role） — organization_members テーブルで管理

| role | スコープ | 取得方法 |
|------|----------|---------|
| `org:owner` | 組織単位 | `organization_members` で `role = 'owner'` |
| `org:member` | 組織単位 | `organization_members` で `role = 'member'` |

同一ユーザーが複数の組織で異なるロールを持てる。

### ページアクセス制御の方針

- **proxy.ts**（グローバル）: 未認証ユーザーを `/auth/sign-in` へリダイレクト（実装済み）
- **Server Component**（ページ単位）: userType・組織ロールが必要なページで明示的に検証
- 権限不足の場合はトップへリダイレクト

### 表示制御の方針

- Server Component で取得した情報を props として子コンポーネントに渡す
- `<RoleGuard>` コンポーネントは作らず、条件分岐で出し分ける（シンプルさ優先）
- クライアントサイドでの権限判定は行わない（サーバーが信頼の源泉）

## 実装済み

### ロール取得ユーティリティ（`apps/web/src/lib/auth.ts`）

```ts
getUser(): Promise<User | null>
getOrgRole(userId, orgId): Promise<'owner' | 'member' | null>
getUserOrgs(userId): Promise<{ org: Organization; role: '...' }[]>
getUserType(userId): Promise<'user' | 'venue_user' | 'system_user'>
isAdmin(userId): Promise<boolean>
```

### ルート設計（実装済み）

```
/[locale]/dashboard/                       ← ログイン済みユーザー全員
/[locale]/dashboard/org/[orgId]/           ← その組織のメンバーのみ
/[locale]/dashboard/org/[orgId]/settings/  ← owner のみ
/[locale]/dashboard/apply/                 ← userType = 'user' かつ未申請のみ
/[locale]/admin/                           ← userType = 'system_user' のみ
/[locale]/admin/applications/              ← 事業者申請一覧・承認・却下
```

### アクセスガードパターン

```tsx
// 未認証ガード
const user = await getUser();
if (!user) redirect(`/${locale}/auth/sign-in`);

// 組織ロールガード
const role = await getOrgRole(user.id, orgId);
if (role !== 'owner') redirect(`/${locale}/dashboard`);

// 管理者ガード
const userType = await getUserType(user.id);
if (userType !== 'system_user') redirect(`/${locale}/dashboard`);
```

### 表示制御パターン

```tsx
// NG: <RoleGuard role="owner"> ... </RoleGuard>
// OK: 明示的な条件分岐
{role === 'owner' && <DeleteButton />}
{userType === 'system_user' && <AdminMenu />}
```

## ダッシュボードの表示分岐

- `userType = 'user'` かつ未申請 → 「事業者として申請する」リンクを表示
- `userType = 'user'` かつ申請中 → 「審査中」バッジを表示
- `userType = 'venue_user'` → 所属組織一覧のみ表示
- `userType = 'system_user'` → 「管理者画面へ」リンクを表示

## チェックリスト（全実装済み）

- [x] `getUser()` / `getOrgRole()` / `getUserOrgs()` 実装
- [x] `getUserType()` / `isAdmin()` 実装
- [x] `users.userType` カラムの追加（DBマイグレーション済み）
- [x] ダッシュボードに所属組織一覧を表示
- [x] userType に応じた dashboard 表示分岐
- [x] 組織ダッシュボード `/org/[orgId]/` にアクセス制御
- [x] owner 限定ページ（設定等）にロールガード
- [x] 未認証・権限不足時のリダイレクト
- [x] 管理者画面 `/admin/` の実装
- [x] 事業者申請フロー `/dashboard/apply/` の実装

## 残作業（TBD）

- 事業者申請フロー（Issue #6 参照）との連携通知
- 管理者画面でのユーザー一覧・userType 変更機能
- 申請却下後の再申請ルール（即時可 or 一定期間後）
