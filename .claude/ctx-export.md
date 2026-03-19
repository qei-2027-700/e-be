# AI Handoff

- Date: 2026-03-19
- Project: e-be
- Branch: main（初回コミット前・未push）

## 作業概要

イーベ（E-be）というイベントバー運営プラットフォームのモノレポを `/Users/km/dev/_github/e-be` に新規構築した。Turborepo + Next.js 16 + shadcn/ui の Web アプリをサンプルページ表示まで実装し、next-intl による日英2言語対応も完了した。プロジェクト全体の設計方針・アーキテクチャ決定をドキュメント化した。

## 完了済みタスク

- Turborepo モノレポ初期構築（`pnpm-workspace.yaml` / `turbo.json`）
- `apps/web` — Next.js 16.2 + shadcn/ui + Tailwind CSS セットアップ
- サンプルホームページ実装（Hero / Features / Stack セクション）
- `next-intl` による日英 i18n 対応（`/ja` / `/en` ルーティング）
- `src/proxy.ts` による言語リダイレクト設定
- `CLAUDE.md` — 開発ガイドライン（UI・モバイルファースト・i18n・課金・アーキテクチャルール）
- `AGENTS.md` — `CLAUDE.md` へのシンボリックリンク
- `README.md` — ローカル起動・ビルド手順
- `.claude/steering/` — 実装計画書群（VitePress・i18n・課金・GitHub repo）
- `.claude/commands/create-steering.md` — `/create-steering <issue番号>` スラッシュコマンド
- `docs/architecture/decisions.md` — 8つのアーキテクチャ意思決定記録
- `suppressHydrationWarning` + `colorScheme` viewport 設定（Dark Reader 対策）

## 未完了・継続タスク

- GitHub リポジトリ未作成・未 push（`.claude/steering/01-github-repo.md` 参照）
- VitePress ドキュメントサイト未構築（`.claude/steering/vitepress-github-pages.md` 参照）
- `packages/db` — Drizzle ORM スキーマ未実装
- `apps/mobile` — Expo 未セットアップ
- Supabase 接続・認証未実装
- `docs/features/` — 機能別ドキュメント未作成

## 重要な決定事項

- **バックエンド構成**: Supabase（BaaS）+ Next.js Route Handlers。専用 API サーバーなし。Mobile は Supabase JS クライアントで直接接続
- **ドキュメント**: VitePress（`docs/`）→ GitHub Pages 公開。`apps/` 配下ではなくルート直下
- **ステアリング**: `.claude/steering/` に AI 生成の実装計画書を Git 管理で保存
- **i18n**: Web は `next-intl`（URL: `/ja/` `/en/`）、Mobile は `i18next`。デフォルト `ja`
- **課金**: Stripe 前提。DB スキーマに `stripe_customer_id` / `plan` / `plan_expires_at` を最初から含める
- **ソフトデリート**: 全テーブルに `deleted_at` 列必須。`DELETE` 文禁止
- **タイムゾーン**: DB は UTC 固定。表示時に `Intl.DateTimeFormat` で変換
- **イベントステートマシン**: `canTransition(from, to)` を通す。直接 status 書き換え禁止
- **機能制限**: `canUseFeature(user, feature)` を通す。コンポーネントに直接判定を書かない

## 変更したファイル（未コミット含む）

```
.claude/steering/01-github-repo.md
.claude/steering/billing-premium.md
.claude/steering/i18n.md
.claude/steering/vitepress-github-pages.md
.claude/commands/create-steering.md   ← /create-steering スラッシュコマンド
.gitignore
AGENTS.md                             ← CLAUDE.md へのシンボリックリンク
CLAUDE.md
README.md
docs/architecture/decisions.md
docs/README.md（空）
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
turbo.json
apps/web/                             ← Next.js 16 全体（未追跡）
docs/architecture/                    ← 未追跡
```

## 次のセッションへの最初の指示

1. `.claude/steering/01-github-repo.md` を読み、GitHub リポジトリを作成して初回 push する
2. push 後に `.claude/steering/vitepress-github-pages.md` を読み、VitePress をセットアップする
3. `packages/db` を作成し、Drizzle ORM スキーマを実装する（`docs/architecture/decisions.md` のソフトデリート・タイムゾーン・ステートマシン方針に従う）
4. dev サーバー起動時は必ず `.next` キャッシュ存在確認をしてから `pnpm dev` を実行する

## プロジェクト文脈

- Tech stack: Turborepo / Next.js 16 (App Router) / Expo / Supabase / Drizzle ORM / shadcn/ui / Tailwind CSS / next-intl / VitePress
- 主要ルール: `CLAUDE.md` および `.claude/steering/` を参照すること
- ローカル開発URL: Web http://localhost:3000 / Docs http://localhost:5173（VitePress未構築）
- 作業ディレクトリ: `/Users/km/dev/_github/e-be`
- pnpm 9 + Node.js 20 必須
