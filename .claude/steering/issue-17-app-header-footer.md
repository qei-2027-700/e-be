# Issue #17: 共通ヘッダー・フッターコンポーネントの実装

## 背景

現状、ダッシュボードにはヘッダー・フッターがなく、サインアウトボタンやユーザー情報が dashboard/page.tsx にベタ書きされている。
認証済みページ全体に一貫したレイアウトを提供するため、共通ヘッダー（AppHeader）と共通フッター（AppFooter）を実装し、
ダッシュボードに dashboard/layout.tsx を追加して適用する。

## 参照

- GitHub Issue: #17
- 関連ドキュメント: docs/architecture/decisions.md #2（UTC表示）
- 既存コンポーネント: apps/web/src/components/lp/nav-bar.tsx（LP専用、変更不要）
- 既存メッセージ: home.footer.* キー（フッターはこれを再利用）

## 実装方針

- AppHeader・AppFooter ともにサーバーコンポーネントで実装
- インタラクション（サインアウト form action）は既存実装のまま維持
- フッターは LP のインラインフッターを切り出して共通コンポーネント化し、LP にも適用
- dashboard/layout.tsx を追加することで、将来のダッシュボード配下ページが自動的にヘッダー・フッターを継承
- フッターの翻訳キーは既存の `home.footer.*` を再利用（新規キー不要）

## 実装ステップ

1. **AppHeader 作成** (`apps/web/src/components/layout/app-header.tsx`)
   - サーバーコンポーネント
   - ロゴ「E-be」→ LP (`/`) へのリンク
   - ユーザーのメールアドレス表示（`user.email`）
   - サインアウトボタン（Server Action `signOut`）
   - `system_user` のみ admin リンク表示
   - Props: `user: { id, email }`, `userType: string`, `locale: string`

2. **AppFooter 作成** (`apps/web/src/components/layout/app-footer.tsx`)
   - サーバーコンポーネント
   - LP のインラインフッター内容をそのまま移植
   - 翻訳キーは `home.footer.*` を使用（`t = getTranslations("home")`）
   - copyright / terms / privacy / contact リンク

3. **ダッシュボード layout 追加** (`apps/web/src/app/[locale]/dashboard/layout.tsx`)
   - サーバーコンポーネント
   - getUser() → 未ログインなら sign-in へリダイレクト
   - getUserType() を呼んで AppHeader に渡す
   - `<AppHeader>` + `{children}` + `<AppFooter>` の構造
   - dashboard/page.tsx から認証チェック・サインアウト・ヘッダー部分を削除

4. **dashboard/page.tsx を整理**
   - layout.tsx に移した認証リダイレクト・signOut Server Action・ヘッダー部分を削除
   - `<main>` のトップにあった「タイトル + Badge + サインアウト + adminリンク」を削除
   - ページ本体（カレンダー・組織カード等）のみに絞る

5. **LP の page.tsx にある footer を AppFooter に置き換え**
   - `<footer>` インライン実装を `<AppFooter locale={locale} />` に変更
   - `getTranslations("home")` の `t` からフッター部分の呼び出しをコンポーネント内に移す

6. **翻訳キー確認**（追加不要）
   - `home.footer.*` は ja.json / en.json ともに既に定義済み → 追加不要

## 影響範囲

- 新規ファイル:
  - `apps/web/src/components/layout/app-header.tsx`
  - `apps/web/src/components/layout/app-footer.tsx`
  - `apps/web/src/app/[locale]/dashboard/layout.tsx`
- 変更ファイル:
  - `apps/web/src/app/[locale]/dashboard/page.tsx`（ヘッダー部分を削除）
  - `apps/web/src/app/[locale]/page.tsx`（フッターを AppFooter に置き換え）
- 翻訳ファイル: 変更なし（既存キーを再利用）

## チェックリスト

- [ ] `apps/web/src/components/layout/app-header.tsx` 作成
  - [ ] ロゴ → LP リンク
  - [ ] ユーザーメール表示
  - [ ] サインアウトボタン（Server Action）
  - [ ] system_user のみ admin リンク
- [ ] `apps/web/src/components/layout/app-footer.tsx` 作成
  - [ ] copyright・terms・privacy・contact リンク
  - [ ] i18n（`home.footer.*` キー使用）
- [ ] `apps/web/src/app/[locale]/dashboard/layout.tsx` 作成
  - [ ] 認証チェック（未ログイン → リダイレクト）
  - [ ] AppHeader / AppFooter 適用
- [ ] `dashboard/page.tsx` からヘッダー・認証・signOut を削除
- [ ] `apps/web/src/app/[locale]/page.tsx` のフッターを AppFooter に置き換え
- [ ] モバイルファースト（min-h-11 タップターゲット確認）
- [ ] Playwright で動作確認（ダッシュボードのヘッダー・フッター表示）
