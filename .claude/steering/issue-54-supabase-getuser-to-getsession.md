# Issue #54: supabase.auth.getUser() のリモートHTTP検証を廃止し getSession() ローカルJWT検証へ変更

## 背景

`lib/auth.ts` の `getUser()` 関数が毎リクエストで `supabase.auth.getUser()` を呼ぶ。
これは Supabase 認証サーバーへの HTTP 往復（ネットワーク I/O）を伴うため、全ページで 1〜3 秒の TTFB 遅延が発生している。

一方 `supabase.auth.getSession()` は Cookie 内の JWT をローカルで検証するため、ネットワーク往復なし。

### middleware の動作確認（重要）

`src/proxy.ts` → `lib/supabase/middleware.ts` の `updateSession()` で、
**すでに `supabase.auth.getUser()` を呼んでセッション Cookie をリフレッシュしている**。

```
リクエスト → proxy.ts の updateSession() → getUser()（Cookie リフレッシュ）
                                                         ↓
                                              Server Component の getUser()（← ここを高速化する）
```

つまり middleware の `getUser()` はセッション更新のために必須であり変更不要。
Server Component 側の `getUser()` だけを `getSession()` に変えれば安全に高速化できる。

## 参照

- GitHub Issue: #54
- 関連ドキュメント: なし（認証基盤の変更）
- 変更対象: `apps/web/src/lib/auth.ts` のみ

## 実装方針

`lib/auth.ts` の `getUser()` 内の `supabase.auth.getUser()` を `supabase.auth.getSession()` に変更する。

### セキュリティ上の根拠

- `getSession()` はサーバーサイドで JWT の署名と有効期限を検証する
- middleware が先に `getUser()` を呼んでいるため Cookie は常に最新の状態
- Supabase 公式: サーバーサイドのデータ取得には `getSession()` で十分

### 変更しない箇所

- `lib/supabase/middleware.ts` の `supabase.auth.getUser()` → リフレッシュ用なので変更不要
- `auth/callback/route.ts` / `auth/confirm/route.ts` → OTP 検証直後の特殊フローなので変更不要

## 実装ステップ

1. `apps/web/src/lib/auth.ts` を開く
2. `getUser()` 関数内の `supabase.auth.getUser()` を `supabase.auth.getSession()` に変更する
   ```ts
   // 変更前
   const { data: { user } } = await supabase.auth.getUser();
   return user ?? null;

   // 変更後
   const { data: { session } } = await supabase.auth.getSession();
   return session?.user ?? null;
   ```
3. 変更はこの 2 行のみ。他のファイルは変更不要

## 影響範囲

- **変更ファイル**: `apps/web/src/lib/auth.ts`（2 行のみ）
- **影響するページ**: `getUser()` を呼ぶすべての Server Component（ほぼ全ページ）が高速化される
- **変更しないファイル**:
  - `apps/web/src/lib/supabase/middleware.ts`
  - `apps/web/src/app/[locale]/auth/callback/route.ts`
  - `apps/web/src/app/[locale]/auth/confirm/route.ts`

## チェックリスト

- [ ] `lib/auth.ts` の `getUser()` を `getSession()` ベースに変更
- [ ] ローカルで開発サーバーを起動し、サインイン → ダッシュボード遷移が正常に動作することを確認
- [ ] Playwright でイベント詳細ページ（`/ja/dashboard/event/...`）が正常表示されることを確認
- [ ] サインアウト後にダッシュボードへアクセスするとサインインページにリダイレクトされることを確認
