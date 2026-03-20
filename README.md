# イーベ (E-be)

「良いイベント」を増やす、店舗と主催者をつなぐイベントバー運営・分析プラットフォーム。

## 公開 URL

| サービス | URL |
|---------|-----|
| Web アプリ | https://e-be-web.vercel.app |
| ドキュメント | https://qei-2027-700.github.io/e-be/ |

## 必要な環境

- Node.js 20.9+
- pnpm 9+

## セットアップ

```bash
git clone https://github.com/<YOUR_USERNAME>/e-be.git
cd e-be
pnpm install
```

## 開発サーバー起動

```bash
pnpm dev:web    # Web のみ → http://localhost:3000
pnpm dev:docs   # ドキュメントのみ → http://localhost:5173
pnpm dev        # 全パッケージ同時起動
```

## ビルド

```bash
# Web のみ
pnpm --filter web build

# ドキュメントのみ
pnpm --filter @e-be/docs build

# 全パッケージ
pnpm build
```

## パッケージ構成

| パッケージ | 場所 | 説明 |
|-----------|------|------|
| `web` | `apps/web` | Next.js 16 管理・ユーザーWeb |
| `mobile` | `apps/mobile` | Expo + React Native（準備中）|
| `@e-be/docs` | `docs/` | VitePress ドキュメントサイト |
| `@e-be/db` | `packages/db` | Drizzle ORM スキーマ（準備中）|

## ドキュメント

- ローカル: `pnpm --filter @e-be/docs dev` → http://localhost:5173
- 公開: https://qei-2027-700.github.io/e-be/

## 技術スタック

- **モノレポ**: Turborepo + pnpm workspaces
- **Web**: Next.js 16 / Vercel
- **Mobile**: Expo + NativeWind
- **BaaS**: Supabase (Postgres / Auth / Storage)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Docs**: VitePress → GitHub Pages
