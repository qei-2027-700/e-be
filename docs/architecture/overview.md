# 全体設計

## アーキテクチャ概要

E-be はモノレポ構成を採用し、Web・モバイルアプリで DB スキーマを共有します。

```
e-be/
├── apps/
│   ├── web/          # Next.js 16 App Router
│   └── mobile/       # Expo (React Native)
├── packages/
│   └── db/           # Drizzle ORM スキーマ
└── docs/             # VitePress ドキュメント
```

## 技術スタック

| レイヤー | 技術 |
|--------|------|
| フロントエンド | Next.js 16, shadcn/ui, Tailwind CSS |
| モバイル | Expo, NativeWind |
| バックエンド | Next.js App Router (Server Actions / Route Handlers) |
| データベース | Supabase (PostgreSQL), Drizzle ORM |
| 認証 | Supabase Auth |
| ビルド | Turborepo, Turbopack |

## 設計原則

- **シンプルさ優先**: 計算で導出できる状態は DB に持たない
- **UTC 統一**: すべての日時は UTC で保存
- **ソフトデリート**: 重要データは `deleted_at` で論理削除
- **マルチテナント**: 事業者（company）を頂点とした階層構造

## データフロー

```
ユーザー操作
  → Next.js Server Action
  → Drizzle ORM (@e-be/db)
  → Supabase (PostgreSQL)
  → RLS (Row Level Security) による権限制御
```
