# AI Handoff

- Date: 2026-03-21
- Project: e-be
- Branch: main

## 作業概要

Issue #67（API実行後のトースト通知）と Issue #68（下書き保存ボタンへのスピナー追加）を実装し、PR 作成・セルフレビュー・squash マージまで完了した。両 PR は main にマージ済みで、worktree もクリーンアップ済み。

## 完了済みタスク

- **#67** — `sonner` を導入し、全 Server Action（参加・キャンセル・申請・承認・却下・イベント作成・編集・公開）の成功/エラー時に画面下部トーストを表示
  - `layout.tsx` に `<Toaster position="bottom-center" richColors />` を追加
  - `ja.json` / `en.json` に `toast_*` 翻訳キーを追加
  - PR #71 → squash マージ済み
- **#68** — `event-edit-form.tsx` の下書き保存・申請・公開ボタンに `Loader2` スピナーを追加（`isPending` 時に回転表示）
  - PR #72 → squash マージ済み

## 未完了・継続タスク

- **#70** — ux: イベント編集フォームの日時入力をカレンダーピッカーに変更（ステアリングなし、要 `/docs-steering 70`）
- **#65** — テストケースの追加：イベント関連（ステアリングなし）
- **#62** — feat: 主催履歴・公開設定機能の実装
- **#61** — feat: クーポン配布・消費フローの実装

## 重要な決定事項

- トースト通知は `sonner@2.0.7` を採用（shadcn/ui v4 推奨ライブラリ）
- `useActionState` 系のコンポーネントは `useEffect` で state を監視してトーストを発火するパターンを採用
- `useTransition` 系は直接 action の戻り値をチェックしてトーストを発火

## 変更したファイル（未コミット含む）

（なし — すべてコミット・マージ済み）

## 次のセッションへの最初の指示

- `git pull origin main` で最新状態に更新する
- 次に着手する Issue を確認する: `gh issue list --repo qei-2027-700/e-be --state open --limit 10`
- `backlog` ラベルの Issue は実装対象外（CLAUDE.md ルール参照）
- ステアリングファイルがある Issue を優先: `ls .claude/steering/issue-*.md`
- `/implement <番号>` で実装を開始する（1セッション最大3 Issue）

## プロジェクト文脈

- Tech stack: Next.js 16 (App Router) + Supabase + Drizzle ORM (Neon) + next-intl + shadcn/ui + Tailwind CSS + sonner
- 主要ルール: CLAUDE.md および `.claude/rules/` を参照すること
- ローカル開発URL: http://localhost:3001（`apps/web` で `pnpm dev --port 3001`）
- テストアカウント: `test-user@e-be.internal` / `testpass2026`（一般ユーザー）、`test-venue@e-be.internal` / `testpass2026`（事業者）
- monorepo 構成: worktree 作成後は `pnpm install` と `pnpm --filter @e-be/db build` が必要
