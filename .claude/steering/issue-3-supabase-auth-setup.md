# Issue #3: Supabase 接続・認証セットアップ

## 背景

packages/db（#2）でスキーマが確定したので、次のステップとして Supabase プロジェクトへの接続と認証フローを実装する。
Next.js App Router + next-intl（`/[locale]/`ルーティング）の構成に Supabase Auth を統合する。

## 参照

- GitHub Issue: #3
- `docs/architecture/decisions.md` #5（ストレージパス設計）
- `docs/architecture/decisions.md` #6（監査ログ）
- `docs/architecture/decisions.md` #11（ロール設計）
- `.claude/steering/db-schema.md`（スキーマ詳細）
- `.claude/steering/i18n.md`（next-intl ルーティング構成）

## 実装方針

- Supabase Auth を ID プロバイダーとして使用し、セッション管理を `@supabase/ssr` に委譲する
- `proxy.ts`（Next.js 16 の middleware 相当）で next-intl と Supabase Auth を **両立** させる
  - next-intl の `createMiddleware` を呼びつつ、Supabase のセッション cookie を更新する
  - 未認証アクセスを `/[locale]/auth/sign-in` へリダイレクトする
- クライアント用・サーバー用・ルート用で Supabase クライアントを分離し、cookie の扱いを正しくする
- `users` テーブルは Supabase Auth の `auth.users` と別に管理する（アプリ側の拡張データ用）
  - Supabase Auth サインアップ後に `public.users` へ upsert するトリガーまたは Server Action で同期

## 実装ステップ

1. **パッケージインストール**
   ```bash
   pnpm --filter web add @supabase/supabase-js @supabase/ssr
   ```

2. **環境変数の追加**（`apps/web/.env.local`）
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```
   `.env.local` は `.gitignore` に含まれていることを確認する。

3. **Supabase クライアントの作成** (`apps/web/src/lib/supabase/`)
   - `client.ts` — ブラウザ用（`createBrowserClient`）
   - `server.ts` — Server Components / Route Handlers 用（`createServerClient` + `cookies()`）
   - `middleware.ts` — proxy.ts 内でセッション更新に使う helper（`createServerClient` + `cookies()` の get/set/remove）

4. **proxy.ts の更新**
   - Supabase セッション cookie を更新（`supabase.auth.getUser()` を呼ぶ）
   - 認証が必要なルート（`/[locale]/dashboard` 以下など）で未認証ならサインインページへリダイレクト
   - next-intl の `createMiddleware` との共存: Supabase のレスポンスを next-intl のミドルウェアで上書きしない順序で処理する
   - パブリックルート: `/[locale]/auth/*`、`/[locale]/`（トップページ）、`/api/*`

5. **認証ページの作成** (`apps/web/src/app/[locale]/auth/`)
   - `sign-in/page.tsx` — メール+パスワード、Google OAuth ボタン
   - `sign-up/page.tsx` — メール+パスワード登録フォーム
   - `callback/route.ts` — OAuth コールバック用 Route Handler（`exchangeCodeForSession`）
   - `confirm/route.ts` — メール確認リンクの処理（`type=signup` など）

6. **`public.users` の同期**
   - Supabase Auth でサインアップ後、`public.users` に upsert する
   - 方針: `callback/route.ts` 内で Server-side に upsert（シンプル）
     または Supabase の DB Function + Trigger（`auth.users` INSERT 時に自動同期）
   - Issue に記載なし → 実装時に確認する

7. **Drizzle スキーマを Supabase に push**
   ```bash
   # packages/db/drizzle.config.ts に DATABASE_URL を設定後
   pnpm --filter @e-be/db push
   ```

8. **RLS ポリシーの設定**（Supabase Studio または SQL ファイル）
   - `public.users`: 自分のレコードのみ読み書き可
   - `public.organizations`: メンバーが読み取り可、owner が更新可
   - `public.events`: published は全員読み取り可、作成者が更新可
   - 詳細は実装時にルールを詰める（初期は最小限）

## 影響範囲

- `apps/web/package.json` — `@supabase/supabase-js`, `@supabase/ssr` 追加
- `apps/web/.env.local` — 新規作成（gitignore済みを確認）
- `apps/web/src/lib/supabase/` — 新規ディレクトリ（3ファイル）
- `apps/web/src/proxy.ts` — next-intl + Supabase 認証チェック統合
- `apps/web/src/app/[locale]/auth/` — 新規ディレクトリ（4ファイル）
- `packages/db/drizzle.config.ts` — DATABASE_URL 参照設定（新規 or 更新）

## チェックリスト

- [ ] Supabase プロジェクトが作成され、URL と anon key が手元にある
- [ ] `@supabase/supabase-js` / `@supabase/ssr` インストール済み
- [ ] `apps/web/.env.local` に環境変数設定済み
- [ ] `lib/supabase/client.ts`, `server.ts`, `middleware.ts` 作成済み
- [ ] `proxy.ts` で Supabase セッション更新 + 認証リダイレクト動作する
- [ ] `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`, `/auth/confirm` ページ・ルート作成済み
- [ ] メール+パスワードのサインアップ・サインインが動作する
- [ ] Google OAuth が動作する（Issue に記載あり）
- [ ] `public.users` が Supabase Auth と同期する
- [ ] `drizzle-kit push` でスキーマが Supabase に適用済み
- [ ] 基本的な RLS ポリシーが設定済み
