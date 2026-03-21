# Issue #45: perf: パブリックパスでのミドルウェアセッション更新スキップ

## 背景

`proxy.ts` のミドルウェアは全パスで `updateSession()` を呼び出しており、
`supabase.auth.getUser()` のネットワーク往復が毎リクエスト発生している。
パブリックパス（`/auth/sign-in` 等）では認証チェックが不要なため、
`updateSession()` をスキップすることでページ表示速度を改善する。

## 参照

- GitHub Issue: #45
- 関連ドキュメント: なし（ミドルウェア最適化）

## 実装方針

`isPublicPath()` チェックを `updateSession()` 呼び出しの**前**に移動し、
パブリックパスなら `intlResponse` をそのまま返す。

- パブリックパス: `/`, `/auth/sign-in`, `/auth/sign-up`, `/auth/callback`, `/auth/confirm`
- `/auth/callback` はOAuthコールバック処理を別途持つが、ミドルウェアの `updateSession` は不要
- 既存の「ログイン済みユーザーをダッシュボードへリダイレクト」機能は現在未実装のため、
  この変更で失われる機能はない

## 実装ステップ

1. `apps/web/src/proxy.ts` を開く
2. `isPublicPath()` チェックを `updateSession()` の前に移動する：

```ts
// Before
export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { response, user } = await updateSession(request, intlResponse);  // 全パスで実行

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    // redirect
  }
  return response;
}

// After
export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  if (isPublicPath(request.nextUrl.pathname)) {
    return intlResponse;  // パブリックパスはセッション更新不要
  }

  const { response, user } = await updateSession(request, intlResponse);

  if (!user) {
    // redirect to sign-in
  }
  return response;
}
```

## 影響範囲

- `apps/web/src/proxy.ts` のみ
- ミドルウェア・DB・スキーマへの変更なし

## チェックリスト

- [ ] `isPublicPath()` チェックを `updateSession()` 前に移動
- [ ] パブリックパスで `intlResponse` をそのまま返す
- [ ] 保護ルートへの未認証アクセスは従来通りサインインへリダイレクトされることを確認
- [ ] サインインページへのアクセスは正常に表示されることを確認
