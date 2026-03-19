# E-be — Claude Code 開発ガイドライン

## 設計原則

- **シンプルさを優先する**。複雑な仕組みで解決できることが、シンプルな仕組みでも解決できるなら、必ずシンプルな方を選ぶ
- インフラ・cron・バックグラウンドジョブは「本当に必要か」を問う。計算で導出できるならそうする
  - 例: `ongoing` / `completed` ステータスは cron で更新せず、`start_at` / `end_at` から導出する
- 状態は「操作によって変わるもの」と「時刻・条件から導出できるもの」を区別する。後者は DB に持たない
- 実装時に TBD に遭遇した場合は**勝手に決めず**、ユーザーに確認する。TBD のまま実装できる範囲だけ実装し、残りをコメントで明示する
- 機能追加のたびにこの原則に立ち返る

## AI 駆動開発ワークフロー

```
① docs/features/{feature}.md にビジネスルールを書く
② /create-steering <issue番号> でステアリングファイルを生成
③ AI がステアリングを読んで実装する
④ Playwright MCP でスクリーンショットを取得して動作検証
⑤ commit → push → PR 作成 → セルフレビュー
```

### 実装前に必ず確認すること

- `docs/features/` に該当機能の .md があるか
- `.claude/steering/` に実装計画の .md があるか
- `docs/architecture/decisions.md` の関連する意思決定を読んだか

### カスタムコマンド

| コマンド | 役割 |
|---------|------|
| `/create-steering <issue番号>` | Issue + features/ を読んでステアリング生成 |
| `/implement-feature <issue番号>` | ステアリングを読んで実装・検証・PR まで自動実行 |
| `/ctx-export` | セッション引き継ぎ文書を生成 |

## パス別ルール（`.claude/rules/`）

| ファイル | 対象 | 内容 |
|---------|------|------|
| `ui-interaction.md` | `apps/web/src/**` | hover/active・cursor・アニメーション |
| `mobile-first.md` | `apps/**` | Tailwind レスポンシブ・タップターゲット |
| `i18n.md` | `apps/**` `packages/**` | next-intl・i18next・翻訳キー必須 |
| `billing.md` | `apps/**` `packages/db/**` | canUseFeature・Stripe・スキーマ予約 |
| `architecture.md` | `apps/**` `packages/**` | ソフトデリート・UTC・ステートマシン等 |
| `coding-conventions.md` | `apps/**` `packages/**` | shadcn/ui・Server Components・Tailwind |

## ディレクトリ構成

- `apps/web` — Next.js 16 Web アプリ
- `apps/mobile` — Expo モバイルアプリ
- `docs/` — VitePress ドキュメントサイト（GitHub Pages 公開）
- `docs/features/` — 機能別ビジネスルール（AI 実装の入力源）
- `packages/db` — Drizzle ORM スキーマ（Web/Mobile 共有）

