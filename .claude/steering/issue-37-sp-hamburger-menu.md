# Issue #37: UI: SP ハンバーガーメニューの実装（AppHeader）

## 背景

現在の `AppHeader` はロゴ・メールアドレス・サインアウトボタンのみで、ナビゲーションがない。
SP（スマートフォン）では設定ページ等へのアクセス手段がないため、ハンバーガーメニューを追加する。

## 参照

- GitHub Issue: #37
- `.claude/rules/mobile-first.md`
- `.claude/rules/ui-interaction.md`

## 実装方針

### SP / PC の表示分岐

- **SP（`md` 未満）**: 右上にハンバーガーアイコン → タップで Sheet メニューを開く
- **PC（`md` 以上）**: 既存レイアウト維持。ヘッダー右側にナビリンクを追加（`hidden md:flex`）

### Sheet コンポーネント

shadcn/ui の Sheet（`side="right"`）を使用。未導入のため `npx shadcn@latest add sheet` で追加。
Sheet は `'use client'` が必要なため、ハンバーガーメニュー部分を Client Component に分離する。

### メニュー項目

| 項目 | リンク先 | 表示条件 |
|------|---------|---------|
| ダッシュボード | `/[locale]/dashboard` | 常時 |
| アカウント設定 | `/[locale]/dashboard/settings` | 常時 |
| サインアウト | Server Action | 常時 |
| 管理者画面 | `/[locale]/admin` | `system_user` のみ |

### コンポーネント分離

`AppHeader` は Server Component のまま維持。
`HamburgerMenu` として Client Component を新規作成し、`AppHeader` に埋め込む。

```
AppHeader (Server Component)
  └── HamburgerMenu (Client Component)
        └── Sheet + メニュー項目
```

## 実装ステップ

1. **Sheet コンポーネントをインストール**
   ```bash
   cd apps/web && npx shadcn@latest add sheet
   ```

2. **`HamburgerMenu` Client Component を作成**
   - パス: `apps/web/src/components/layout/hamburger-menu.tsx`
   - props: `locale: string`, `userType: 'user' | 'venue_user' | 'system_user'`
   - Sheet の `side="right"` でスライドイン
   - サインアウトは `form action` の Server Action を props 経由で渡す（または Route に切り出す）
   - **注意**: `AppHeader` の `signOut` Server Action は `AppHeader` 内で定義されているため、
     `HamburgerMenu` には `onSignOut` として渡すか、`/api/auth/sign-out` Route を作る方が安全。
     → シンプルに `/[locale]/auth/sign-out` のような Route Handler を作る方針を採用。

3. **サインアウト Route Handler を作成（または Server Action を共有）**
   - `apps/web/src/app/[locale]/auth/sign-out/route.ts` として POST endpoint を作成
   - または `apps/web/src/app/actions.ts` に共有 Server Action を切り出す
   - **採用方針**: `apps/web/src/lib/actions/auth.ts` に `signOutAction` を切り出し、
     `AppHeader` と `HamburgerMenu` の両方から import する

4. **`AppHeader` を更新**
   - SP: ハンバーガーアイコン（`md:hidden`）を右端に追加し `HamburgerMenu` を埋め込む
   - PC: メニューリンクを `hidden md:flex` で追加（任意・必要に応じて）

5. **i18n テキスト追加**
   - `apps/web/messages/ja.json`: `dashboard.nav.dashboard`, `dashboard.nav.account_settings`, `dashboard.nav.admin`
   - `apps/web/messages/en.json`: 同上

6. **動作確認（Playwright MCP）**
   - SP サイズ（375px 幅）でハンバーガーアイコンの表示確認
   - タップ → Sheet が開く
   - 各メニュー項目のナビゲーション確認

## 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `apps/web/src/components/layout/app-header.tsx` | 変更（HamburgerMenu 埋め込み） |
| `apps/web/src/components/layout/hamburger-menu.tsx` | 新規作成 |
| `apps/web/src/components/ui/sheet.tsx` | 新規（shadcn install） |
| `apps/web/src/lib/actions/auth.ts` | 新規（signOutAction 切り出し） |
| `apps/web/messages/ja.json` | テキスト追加 |
| `apps/web/messages/en.json` | テキスト追加 |

## チェックリスト

- [ ] SP（375px）でハンバーガーアイコンが右上に表示される
- [ ] タップで Sheet が右からスライドイン
- [ ] ダッシュボード・アカウント設定・サインアウトの3項目が表示される
- [ ] `system_user` のみ管理者画面リンクが表示される
- [ ] PC（1024px）ではハンバーガーアイコンが非表示
- [ ] タップターゲット最低 44px（`min-h-11`）
- [ ] `cursor-pointer` が適用されている
- [ ] i18n（ja / en）対応済み
- [ ] TypeScript エラーなし
