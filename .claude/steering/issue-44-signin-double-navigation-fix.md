# Issue #44: perf: サインイン後の二重ナビゲーション解消（router.push + router.refresh → window.location.href）

## 背景

サインイン成功後に `router.push(next)` + `router.refresh()` を連続呼び出しているため、
Next.js ミドルウェアが2回実行され、Supabase Auth への HTTP 呼び出しが余分に1回発生している。
結果として合計3回の Supabase API 呼び出しが直列発生し、体感的な遅延につながっている。

## 参照

- GitHub Issue: #44
- 関連ドキュメント: なし（認証フロー固有の最適化）

## 実装方針

`window.location.href = next` によるフルページナビゲーションに置き換える。

- Supabase クライアントはサインイン成功時点でブラウザの cookie にセッションをセット済み
- フルナビゲーションにより、その cookie が1回のリクエストで正しくサーバーに送信される
- ミドルウェアの実行は1回のみとなり、`updateSession()` の呼び出しも1回に削減される
- `useRouter` が不要になるため、関連 import も整理する

## 実装ステップ

1. `apps/web/src/app/[locale]/auth/sign-in/page.tsx` を開く
2. `signIn()` 関数内の以下のコードを置き換える：
   ```ts
   // Before
   router.push(next);
   router.refresh();

   // After
   window.location.href = next;
   ```
3. `useRouter` が他の箇所で使われていないか確認し、不要なら import を削除する
4. `router` の state 変数宣言 (`const router = useRouter()`) も不要なら削除する

## 影響範囲

- `apps/web/src/app/[locale]/auth/sign-in/page.tsx` のみ
- ミドルウェア・DB・スキーマへの変更なし

## チェックリスト

- [ ] `signIn()` 関数内の `router.push + router.refresh` を `window.location.href` に変更
- [ ] 不要な `useRouter` import・変数宣言を削除
- [ ] テストアカウントでサインインし、ダッシュボードへ正常に遷移することを確認
- [ ] `next` パラメータ付きURL（例: `/ja/dashboard`）でも正しくリダイレクトされることを確認
