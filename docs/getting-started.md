# はじめに

## 概要

E-be（イーベ）は、イベントバーの店舗運営を支援するプラットフォームです。店舗オーナーと主催者をつなぎ、イベント開催リクエスト・承認・スケジュール管理を一元化します。

## 前提条件

- Node.js 20+
- pnpm 9+
- PostgreSQL（Supabase）

## セットアップ

```bash
# リポジトリをクローン
git clone https://github.com/qei-2027-700/e-be.git
cd e-be

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp apps/web/.env.example apps/web/.env.local
# .env.local を編集して Supabase の設定を入力

# データベースのマイグレーション
pnpm --filter @e-be/db db:push

# 開発サーバーを起動
pnpm --filter @e-be/web dev
```

## モノレポ構成

| ディレクトリ | 説明 |
|------------|------|
| `apps/web` | Next.js 16 Web アプリ |
| `apps/mobile` | Expo モバイルアプリ |
| `packages/db` | Drizzle ORM スキーマ（共有） |
| `docs/` | このドキュメントサイト |

## 開発コマンド

```bash
# Web アプリ開発
pnpm --filter @e-be/web dev

# ドキュメントサイト開発
pnpm --filter @e-be/docs dev

# 全体ビルド
pnpm build

# 型チェック
pnpm typecheck
```
