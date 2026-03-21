# E-be — Claude Code 開発ガイドライン

## 設計原則

- **シンプルさを優先する**。計算で導出できるものは DB に持たない（cron・バックグラウンドジョブも同様に疑う）
- 実装時に TBD に遭遇した場合は**勝手に決めず**、ユーザーに確認する。TBD のまま実装できる範囲だけ実装し、残りをコメントで明示する
- 機能追加のたびにこの原則に立ち返る

## AI 駆動開発ワークフロー

### 全体フロー

```
① 現状確認
   - docs/features/ と .claude/steering/ の既存ファイルを確認
   - コードの現状（schema.ts・既存実装）を把握

② Issue 起票（1セッションにつき最大 3 issue）
   - 実装に必要な最小単位で起票する
   - 1回の指示で起票する Issue は 3 つまで

③ ステアリング生成
   - /docs-steering <issue番号> を実行
   - Issue 本文 + docs/features/*.md の両方を参照して .claude/steering/ に md を生成

④ ブランチ作成
   - git worktree または通常ブランチで実装用ブランチを切る
   - ブランチ名: feat/issue-{番号}-{kebab-case}

⑤ 実装
   - ステアリングファイルを読んでから着手する
   - TBD に遭遇したら勝手に決めず確認する

⑥ Playwright MCP で自己検証
   - 開発サーバーを起動し、実装した機能を動作確認
   - スクリーンショットを取得（.gitignore 対象、コミットしない）
   - エラー・表示崩れがあれば修正してから次へ進む

⑦ commit → push → PR 作成

⑧ PR セルフレビュー
   - diff を確認し、意図しない変更・漏れがないか確認
   - 問題があれば追加コミットで修正

⑨ main へマージ

⑩ 次の Issue に着手
```

### 制約・ルール

- **1セッション最大 3 issue**: 一度の指示で起票・着手する Issue は 3 つまで。優先度の高いものから絞る
- **ステアリング必須**: `.claude/steering/` に実装計画がない Issue の実装は開始しない
- **スクリーンショットはコミット対象外**: Playwright で取得した検証画像は `.gitignore` に含める
- **`backlog` ラベルは実装対象外**: `backlog` ラベルが付いている Issue は実装・着手しない。Issue 一覧を参照する際はこのラベルを除外すること

### 実装前に必ず確認すること

- `docs/features/` に該当機能の .md があるか
- `.claude/steering/` に実装計画の .md があるか
- `docs/architecture/decisions.md` の関連する意思決定を読んだか

### カスタムコマンド

| コマンド | 役割 | 次の工程 |
|---------|------|---------|
| `/survey` | 現状確認（docs/steering/schema/実装） | → `/gh-issue` |
| `/gh-issue` | Issue 起票（max 3、gh コマンド） | → `/docs-steering <番号>` |
| `/docs-steering <番号>` | ステアリング生成 | → `/implement <番号>` |
| `/implement <番号>` | ブランチ作成＋実装 | → `/pw-verify` |
| `/pw-verify` | Playwright スクリーンショット＋動作確認 | → `/gh-ship` |
| `/gh-ship` | commit + push | → `/gh-pr` |
| `/gh-pr` | PR 作成 | → `/gh-rv` |
| `/gh-rv` | 2段階セルフレビュー → squash マージ | → `/survey` or `/gh-issue` |
| `/ctx-export` | セッション引き継ぎ文書を生成 | — |

## パス別ルール（`.claude/rules/`）

| ファイル | 対象 | 内容 |
|---------|------|------|
| `ui-interaction.md` | `apps/web/src/**` | hover/active・cursor・アニメーション |
| `mobile-first.md` | `apps/**` | Tailwind レスポンシブ・タップターゲット |
| `i18n.md` | `apps/**` `packages/**` | next-intl・i18next・翻訳キー必須 |
| `billing.md` | `apps/**` `packages/db/**` | canUseFeature・Stripe・スキーマ予約 |
| `architecture.md` | `apps/**` `packages/**` | ソフトデリート・UTC・ステートマシン等 |
| `coding-conventions.md` | `apps/**` `packages/**` | shadcn/ui・Server Components・Tailwind |
| `testing.md` | `apps/web/**` | テストアカウント・seed コマンド |

