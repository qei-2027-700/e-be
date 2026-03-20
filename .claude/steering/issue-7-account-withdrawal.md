# Issue #7: 退会処理機能の実装

## 背景

ユーザーが自分のアカウントを退会（削除）できる機能。個人情報保護法等の法的要件・プライバシー観点から必須。
既存のソフトデリート方針・テナント階層・ステートマシン設計との整合性を保ちつつ実装する。

## 参照

- GitHub Issue: #7
- 関連ドキュメント: `docs/features/account-withdrawal.md`（本 Issue で作成）
- `docs/architecture/decisions.md` #1（ソフトデリート）
- `docs/architecture/decisions.md` #6（監査ログ）
- `docs/architecture/decisions.md` #11（テナント階層・ユーザー種別）
- `docs/architecture/decisions.md` #13（owner 権限移譲）
- `.claude/steering/db-schema.md`（テーブル設計）
- `.claude/steering/auth-role-control.md`（認証・ロール制御）

## 現状の把握

### スキーマ（`packages/db/src/schema.ts`）

- `users` テーブル: `deleted_at` は `commonColumns` mixin で既存。退会フラグとして流用可能
- `users.userType` カラム: **スキーマには未実装**（steering docs には設計済み、DBマイグレーション未）
- `organization_members`: `deleted_at` あり（論理削除済み）
- `bar_host_permissions`: `revoked_at` あり（無効化用）
- `audit_logs`: `user_id NOT NULL`（退会処理の記録に使用可能）

### 認証フロー（`apps/web/src/proxy.ts` / `apps/web/src/lib/auth.ts`）

- `getUser()` は Supabase Auth のユーザーを返す（**DBの `users` レコードではない**）
- proxy.ts は Supabase セッションの有無のみチェック。DB の `deleted_at` はチェックしていない
- 退会後、Supabase Auth ユーザーを削除すれば自然にセッション無効化できる

## 実装方針

### ソフトデリートの活用

`users.deleted_at` を退会フラグとして使用。物理削除は行わない。
イベント履歴・参加記録は `deleted_at` 付きのまま保持する。

### 退会のブロック条件（DB クエリで事前チェック）

1. **`organization_members` に `role = 'owner'` かつ `deleted_at IS NULL` のレコードが存在する**
   - 所有権移譲（Issue #13 参照）または組織削除を先に行うよう案内
2. **`events` に `status = 'published'` かつ `end_at > now()` かつ `user_id = 退会ユーザー` のレコードが存在する**
   - イベントをキャンセルしてから退会するよう案内

### 退会処理（1トランザクション）

```ts
// packages/db/src/withdrawal.ts（新規）
async function withdrawUser(userId: string, supabaseAuthId: string): Promise<void>
```

1. ブロック条件の最終チェック（競合対策）
2. `organization_members.deleted_at = now()` where `user_id = userId AND deleted_at IS NULL`
3. `bar_host_permissions.revoked_at = now()` where `user_id = userId AND revoked_at IS NULL`
4. `users.deleted_at = now()` where `id = userId`
5. `audit_logs` に `action: 'user_withdrawn'`, `entity_type: 'user'`, `entity_id: userId` で記録
6. Stripe サブスクリプションのキャンセル（`stripeCustomerId` があれば）— Issue に記載あり、Stripe 未導入なら条件分岐でスキップ
7. `supabase.auth.admin.deleteUser(supabaseAuthId)` で Supabase Auth ユーザーを削除

**注意**: `audit_logs.user_id` は退会ユーザー自身の ID を入れる。トランザクション内で `users.deleted_at` を設定する前に `audit_logs` を INSERT することで FK 制約を満たす。

### proxy.ts への退会済みチェック追加

Supabase Auth ユーザーを削除するため、次回ログイン試行時に自動的に弾かれる。
ただし**セッションが生きている間にアクセスされるケース**に対応するため、
proxy.ts または Server Component でDBの `deleted_at` チェックを追加する。

```ts
// proxy.ts に追加（軽量チェック）
// Supabase Auth ユーザー削除後はセッション無効化されるため、
// DB チェックは Server Component 側で行う方針（proxy.ts は Edge Runtime のため DB アクセス不可）
```

→ **ダッシュボードの root layout**（`app/[locale]/dashboard/layout.tsx`）で `getDbUser()` を呼び、`deleted_at` が設定されていれば `/` にリダイレクト。

### UI フロー

```
/[locale]/dashboard/settings  ← 設定ページ（未実装なら新規作成）
  └── 「退会する」ボタン（赤系、目立たせすぎない位置）
        → ブロッカーチェック API（Server Action）
          → ブロッカーあり: エラーメッセージ＋解決リンクを表示
          → ブロッカーなし: 確認ダイアログ
              → テキストフィールドに「退会する」と入力
                → 退会 Server Action 実行
                  → `/[locale]` へリダイレクト（セッション破棄済み）
```

## 実装ステップ

1. **`docs/features/account-withdrawal.md` 作成**
   - ビジネスルール・UX フロー・スコープ外をドキュメント化

2. **`packages/db/src/withdrawal.ts` 作成**
   - `checkWithdrawalBlockers(userId)`: ブロック条件を確認し、エラー理由を返す
   - `withdrawUser(userId, supabaseAuthId)`: トランザクションで退会処理を実行

3. **`apps/web/src/lib/auth.ts` に `getDbUser()` 追加**
   - Supabase Auth ユーザーの `email` で `users` テーブルを検索して DB ユーザーを返す
   - `deleted_at IS NULL` 条件を付与

4. **`apps/web/src/app/[locale]/dashboard/layout.tsx` に退会済みチェック追加**
   - `getDbUser()` で `deleted_at` を確認、設定済みなら `/[locale]` へリダイレクト

5. **Server Action 作成（`apps/web/src/app/[locale]/dashboard/settings/actions.ts`）**
   - `checkWithdrawalAction()`: ブロッカーチェックを返す
   - `withdrawAction()`: 退会処理を実行し、Supabase Auth ユーザーを削除

6. **設定ページ UI（`apps/web/src/app/[locale]/dashboard/settings/page.tsx`）**
   - 「退会する」ボタン
   - AlertDialog または Sheet で確認フロー
   - 「退会する」文字列入力でボタン活性化

7. **i18n テキスト追加**
   - `apps/web/messages/ja.json` / `en.json` に退会関連テキストを追加

8. **動作確認（Playwright MCP）**
   - 正常退会フロー
   - ブロッカーあり時のエラー表示
   - 退会後の再ログイン不可確認

## 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `packages/db/src/withdrawal.ts` | 新規作成 |
| `packages/db/src/index.ts` | export 追加 |
| `apps/web/src/lib/auth.ts` | `getDbUser()` 追加 |
| `apps/web/src/app/[locale]/dashboard/layout.tsx` | 退会済みチェック追加 |
| `apps/web/src/app/[locale]/dashboard/settings/page.tsx` | 新規作成（設定ページ） |
| `apps/web/src/app/[locale]/dashboard/settings/actions.ts` | 新規作成（Server Actions） |
| `apps/web/messages/ja.json` | テキスト追加 |
| `apps/web/messages/en.json` | テキスト追加 |
| `docs/features/account-withdrawal.md` | 新規作成 |

## チェックリスト

- [ ] `docs/features/account-withdrawal.md` 作成済み
- [ ] `checkWithdrawalBlockers()` が owner チェック・公開イベントチェックを正しく返す
- [ ] 退会トランザクションが全テーブルを一括で論理削除する
- [ ] Supabase Auth ユーザーが削除される（`auth.admin.deleteUser()`）
- [ ] 退会済みユーザーがダッシュボードにアクセスすると `/` にリダイレクトされる
- [ ] 確認ダイアログで「退会する」と入力しないとボタンが活性化しない
- [ ] ブロッカーあり時に解決方法が表示される
- [ ] `audit_logs` に `user_withdrawn` が記録される
- [ ] i18n（日本語・英語）対応済み
- [ ] モバイルファースト（タップターゲット 44px 以上）

## 未確認事項

- Stripe 未導入の場合、ステップ6（サブスクリプションキャンセル）はスキップ実装でよいか → `stripeCustomerId` が null の場合のみスキップする条件分岐で対応
- `users.userType` カラムは本 Issue スコープ外（別途マイグレーション）
- 退会後メール通知は TBD（Issue に記載なし、スコープ外）
