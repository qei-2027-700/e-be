# AI Handoff

- Date: 2026-03-25
- Project: e-be
- Branch: main

## 作業概要

Issue #161（watchオーガナイザー・公開通知）、#160（IME Enter バグ修正）、#162（AI agent イベント作成）の3件を実装・PR作成・マージまで完了した。いずれも git worktree を利用して独立ブランチで開発し、Playwright MCP で動作確認後に squash マージした。

## 完了済みタスク

- **#161 / PR #163**: watch オーガナイザー＋公開通知機能（`userWatches` テーブル追加、通知 dedupe、notifications ページ、イベント詳細の watch ボタン）→ マージ済み
- **#160 / PR #165**: IME composition 中の Enter キーでチャット送信される不具合を `e.nativeEvent.isComposing` チェックで修正 → マージ済み
- **#162 / PR #166**: AI agent イベント作成（`listBars` + `createEvent` ツール、chat widget 結果カード UI）→ マージ済み
- **Issue #167 起票**: AI chat widget の i18n 対応（should 判定 → 将来対応）

## 未完了・継続タスク

- **Issue #167**: AI chat widget の i18n 対応（テキストハードコード・`/ja/` locale prefix）— 未着手、将来対応
- その他 open Issue は `gh issue list --repo qei-2027-700/e-be --state open` で確認

## 重要な決定事項

- **AIチャット API route から Server Action は直接呼べない**（`'use server'` ディレクティブの制約）。`createEvent` ツールは `db.insert` を `route.ts` 内で直接実装した
- **drizzle-kit 0.24.2 のバグ**で `pnpm db:push` が失敗する場合は `psql` でマイグレーション SQL を直接実行する
- **worktree のベースブランチ**は必ず `main`（または最新の origin/main）から切ること。旧ブランチから切ると PR diff に余計なコミットが混入する
- chat widget 内の静的テキストは日本語直書き可（ステアリング issue-162 に明記）

## 変更したファイル（未コミット含む）

（クリーン状態 — 未コミット変更なし）

## 次のセッションへの最初の指示

- `git pull origin main` で最新化してから作業を始める
- 次の実装候補を確認: `gh issue list --repo qei-2027-700/e-be --state open --limit 10`
- `backlog` ラベルの Issue は着手しない（CLAUDE.md ルール参照）
- ステアリングがある Issue を優先: `ls .claude/steering/issue-*.md`
- `/implement <番号>` で実装を開始する（1セッション最大3 Issue）

## プロジェクト文脈

- Tech stack: Next.js 15 (App Router) + TypeScript + Drizzle ORM + PostgreSQL + Gemini 2.5 Flash (AI SDK v6) + Tailwind CSS + shadcn/ui + next-intl + pnpm workspaces
- 主要ルール: CLAUDE.md および `.claude/rules/` を参照すること
- ローカル開発URL: http://localhost:3000（`apps/web` で `pnpm dev`）
- テストアカウント: `test-user@e-be.internal` / `testpass2026`（一般ユーザー）、`test-venue@e-be.internal` / `testpass2026`（事業者）
- monorepo 構成: worktree 作成後は `pnpm install` と `pnpm --filter @e-be/db build` が必要
