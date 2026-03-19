# イーベ (E-be)

「良いイベント」を増やす、店舗と主催者をつなぐイベントバー運営・分析プラットフォーム。

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
# Web のみ
pnpm --filter web dev
# → http://localhost:3000

# ドキュメントのみ（VitePress セットアップ後）
pnpm --filter @e-be/docs dev
# → http://localhost:5173

# 全パッケージ同時起動
pnpm dev
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
| `@e-be/docs` | `docs/` | VitePress ドキュメントサイト（準備中）|
| `@e-be/db` | `packages/db` | Drizzle ORM スキーマ（準備中）|

## ドキュメント

- ローカル: `pnpm --filter @e-be/docs dev` → http://localhost:5173
- 公開: https://\<YOUR_USERNAME\>.github.io/e-be/

## 技術スタック

- **モノレポ**: Turborepo + pnpm workspaces
- **Web**: Next.js 16 / Vercel
- **Mobile**: Expo + NativeWind
- **BaaS**: Supabase (Postgres / Auth / Storage)
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Docs**: VitePress → GitHub Pages
