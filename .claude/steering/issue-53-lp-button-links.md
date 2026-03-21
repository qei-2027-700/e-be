# Issue #53: LP — ヒーロー・CTAセクションのボタン導線を実装（href="#" を修正）

## 背景

トップページのボタンがすべて `href="#"` のまま未実装で、クリックしても何も起きない状態。
ユーザーの離脱・コンバージョン機会の損失につながるため修正する。

## 参照

- GitHub Issue: #53
- 関連ドキュメント: なし（LP 導線は docs/features/ に該当ファイルなし）
- docs/architecture/decisions.md #227（userType・サインアップ導線）

## 実装方針

`user` と `locale` がサーバーコンポーネントで取得済みのため、
ログイン状態に応じて JSX 内で条件分岐して `href` を決定する。

NavBar（`src/components/lp/nav-bar.tsx`）と同じパターンを踏襲する。

## あるべき導線

| セクション | ボタンテキスト | 未ログイン | ログイン済み |
|-----------|--------------|-----------|------------|
| Hero | 「イベントを探す」 | `/${locale}/dashboard` | `/${locale}/dashboard` |
| Hero | 「開催を申し込む」 | `/${locale}/auth/sign-up` | `/${locale}/dashboard/event/create` |
| CTAセクション | 「無料で始める」 | `/${locale}/auth/sign-up` | `/${locale}/dashboard` |

> 「イベントを探す」は公開イベント一覧ページが未実装のため、暫定で `/dashboard` に設定。

## 実装ステップ

1. `apps/web/src/app/[locale]/page.tsx` を開く
2. `hero.cta_primary`（イベントを探す）の `href="#"` を `/${locale}/dashboard` に変更
3. `hero.cta_secondary`（開催を申し込む）の `href="#"` をログイン状態で条件分岐:
   - 未ログイン: `/${locale}/auth/sign-up`
   - ログイン済み: `/${locale}/dashboard/event/create`
4. `cta_section.button`（無料で始める）の `href="#"` をログイン状態で条件分岐:
   - 未ログイン: `/${locale}/auth/sign-up`
   - ログイン済み: `/${locale}/dashboard`

## 影響範囲

- `apps/web/src/app/[locale]/page.tsx` のみ
- 追加パッケージ・設定変更なし

## チェックリスト

- [ ] `href="#"` が 3 か所すべて修正されている
- [ ] 未ログイン状態でボタンクリック → `/auth/sign-up` に遷移する
- [ ] ログイン済み状態でボタンクリック → `/dashboard` または `/dashboard/event/create` に遷移する
- [ ] `locale` プレフィックスが正しく付いている（`/ja/auth/sign-up` 等）
