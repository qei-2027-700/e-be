# 認証・ロール制御

## 背景

Supabase Auth による認証は完了済み（Issue #3）。次のステップとして：
- 認証状態によるページアクセス制御
- ロール（org:owner / org:member / platform:admin）による表示制御
- 組織コンテキストに応じた UI の出し分け

## 参照

- `docs/architecture/decisions.md` #11（ロール設計）
- `docs/architecture/decisions.md` #12（主催者許可システム）
- `docs/architecture/decisions.md` #13（owner 権限移譲）
- `.claude/steering/db-schema.md`（organization_members テーブル設計）

## 設計方針

### ロールの考え方

ロールは「アカウント種別」ではなく「組織へのメンバーシップ」で決まる。
同一ユーザーが複数の組織で異なるロールを持てる。

| ロール | スコープ | 取得方法 |
|--------|----------|---------|
| `user` | 全体 | Supabase Auth でログイン済みであること |
| `org:owner` | 組織単位 | `organization_members` テーブルで `role = 'owner'` |
| `org:member` | 組織単位 | `organization_members` テーブルで `role = 'member'` |
| `platform:admin` | 全体 | `users` テーブルの専用フラグ（TBD）または固定UID |

### ページアクセス制御の方針

- **proxy.ts**（グローバル）: 未認証ユーザーを `/auth/sign-in` へリダイレクト（実装済み）
- **Server Component**（ページ単位）: ロールチェックが必要なページで明示的に検証
- ロールが不足している場合は 403 ページまたはトップへリダイレクト

### 表示制御の方針

- Server Component で取得したロール情報を props として子コンポーネントに渡す
- `<RoleGuard>` コンポーネントは作らず、条件分岐で出し分ける（シンプルさ優先）
- クライアントサイドでのロール判定は行わない（サーバーが信頼の源泉）

## 実装ステップ

### 1. ロール取得ユーティリティ（`apps/web/src/lib/auth.ts`）

```ts
// 現在のユーザーを取得（未認証なら null）
getUser(): Promise<User | null>

// 指定組織でのロールを取得
getOrgRole(userId: string, orgId: string): Promise<'owner' | 'member' | null>

// ユーザーが所属する全組織とロールを取得
getUserOrgs(userId: string): Promise<{ org: Organization; role: 'owner' | 'member' }[]>
```

### 2. ルート設計（dashboard 配下）

```
/[locale]/dashboard/              ← ログイン済みユーザー全員
/[locale]/dashboard/org/[orgId]/  ← その組織のメンバーのみ
/[locale]/dashboard/org/[orgId]/settings/ ← owner のみ
/[locale]/admin/                  ← platform:admin のみ
```

### 3. アクセスガード（Server Component パターン）

```tsx
// ページ先頭で毎回チェック
const user = await getUser();
if (!user) redirect(`/${locale}/auth/sign-in`);

const role = await getOrgRole(user.id, orgId);
if (role !== 'owner') redirect(`/${locale}/dashboard`);
```

### 4. 表示制御（条件分岐パターン）

```tsx
// NG: <RoleGuard role="owner"> ... </RoleGuard>
// OK: 明示的な条件分岐
{role === 'owner' && <DeleteButton />}
{(role === 'owner' || role === 'member') && <EditButton />}
```

### 5. ダッシュボードに組織一覧を表示

- ログイン後のダッシュボードで自分が所属する組織一覧を表示
- 組織ごとにロールバッジ（owner / member）を表示
- 組織がない場合は「組織を作成」ボタンを表示

## 影響範囲

- `apps/web/src/lib/auth.ts` — 新規作成（ロール取得ユーティリティ）
- `apps/web/src/app/[locale]/dashboard/page.tsx` — 組織一覧表示に更新
- `apps/web/src/app/[locale]/dashboard/org/[orgId]/` — 新規（組織ダッシュボード）
- `apps/web/src/lib/db.ts` — 既存（Drizzle クライアント）

## チェックリスト

- [ ] `getUser()` / `getOrgRole()` / `getUserOrgs()` 実装
- [ ] ダッシュボードに所属組織一覧を表示
- [ ] 組織ダッシュボード `/org/[orgId]/` にアクセス制御
- [ ] owner 限定ページ（設定等）にロールガード
- [ ] 未認証・権限不足時のリダイレクト動作確認

## 未決定事項（TBD）

- `platform:admin` の判定方法（固定UID リスト vs DB フラグ）
- 組織未所属ユーザーのダッシュボード表示内容
- 組織作成フロー（Issue として切り出し推奨）
