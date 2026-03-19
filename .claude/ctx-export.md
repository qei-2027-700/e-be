# AI Handoff

- Date: 2026-03-19
- Project: e-be
- Branch: main

## 作業概要

ロール設計・イベントステートマシン・クーポン機能など主要な設計方針を確定し、`docs/architecture/decisions.md` に記録した。`CLAUDE.md` をスリム化して `.claude/rules/`（paths 付き6ファイル）に分割した。`docs/features/` に機能別ビジネスルール仕様を12ファイル作成し、`docs/README.md` に機能一覧を整備した。

## 完了済みタスク

- ロール設計確定（user / org:owner / org:member / platform:admin）
- イベントステートマシン再設計（stored: draft/pending/published/cancelled/rejected、derived: ongoing/completed）
- 主催者許可システム（bar_host_permissions）設計
- owner 権限移譲設計
- クーポン機能設計（coupons / user_coupons / token カラム追加）
- 店舗イメージカラー設計（HEX保存・プリセット→カスタム拡張可能・WCAG文字色自動判定）
- `docs/architecture/decisions.md` に #9〜#13 追記
- `docs/architecture/validations.md` 作成（フォームバリデーション仕様）
- `CLAUDE.md` スリム化 → `.claude/rules/` に6ファイル分割（paths付き）
- `.claude/commands/implement.md` 作成（/implement スラッシュコマンド）
- `docs/README.md` 作成（機能一覧・TBD・カレンダー連携方針）
- `docs/features/` 12ファイル作成:
  - `bar-search.md` / `coupon.md` / `event-analytics.md` / `event-approval.md`
  - `event-creation.md` / `event-participation.md` / `event-search.md`
  - `eventer-payment.md` / `notifications.md` / `organizer-history.md`
  - `store-calendar.md` / `store-creation.md`
- CSV エクスポート・クリップボードコピーを各機能ファイルに追記
- GitHub Issues 5件作成（#1 VitePress / #2 packages/db / #3 Supabase / #4 Expo / #5 Billing）

## 未完了・継続タスク

- `docs/features/` の残り未コミットファイル（CSV・クリップボード追記分）をコミット
- `packages/db` Drizzle ORM スキーマ実装（#2）← 次の実装優先タスク
- VitePress セットアップ（#1）
- Supabase 接続・認証（#3）
- `apps/mobile` Expo セットアップ（#4）
- 参加表明の仕組み（TBD）・通知タイミング（TBD）・支払いフロー（TBD）の仕様決定

## 重要な決定事項

- **イベントステータス**: DB には `draft/pending/published/cancelled/rejected` のみ保存。`ongoing`/`completed` は `start_at`/`end_at` から導出（cron 不要）
- **クーポン `expired`** も同様に時刻導出。`expires_at` と現在時刻を比較
- **ロール**: アカウント種別ではなく組織メンバーシップで決まる。同一ユーザーが参加者にも主催者にもなれる
- **owner**: 1組織1人。権限移譲機能あり（取り消し不可・audit_logs 記録）
- **クーポン token**: `user_coupons.token`（UUID）を今から入れておく → 将来 QR 化はこれを encode するだけ
- **店舗イメージカラー**: HEX で保存。フェーズ1はプリセットのみ、フェーズ2でカスタム入力追加（スキーマ変更なし）
- **Google Calendar**: アプリは独自カレンダーを持つ。「Google Calendar に追加」ボタンのみ提供（双方向同期は TBD）
- **設計原則**: シンプルさ優先・導出できるものは DB に持たない・TBD は勝手に決めない

## 変更したファイル（未コミット含む）

```
M docs/features/bar-search.md
M docs/features/coupon.md
M docs/features/event-analytics.md
M docs/features/event-creation.md
M docs/features/event-participation.md
M docs/features/event-search.md
M docs/features/eventer-payment.md
M docs/features/organizer-history.md
```

## 次のセッションへの最初の指示

1. 未コミットの `docs/features/` 変更をコミットする（CSV・クリップボードコピー追記分）
2. `docs/features/` と `docs/architecture/decisions.md` を読んで全体設計を把握する
3. `.claude/steering/` に `packages/db` の実装計画を作成する（`/create-steering 2` を使う）
4. `packages/db` の Drizzle ORM スキーマを実装する（Issue #2）
   - テーブル: users / organizations / organization_members / events / bar_host_permissions / bar_blocks / coupons / user_coupons / audit_logs / notifications
   - `packages/db/src/event-transitions.ts` — `canTransition(from, to)`・`resolveStatus(event)`
   - `packages/db/src/plans.ts` — `canUseFeature(plan, feature)`
   - `packages/db/src/notification-types.ts`

## プロジェクト文脈

- Tech stack: Turborepo / Next.js 16.2 (App Router) / Expo / Supabase / Drizzle ORM / shadcn/ui / Tailwind CSS / next-intl / VitePress
- 主要ルール: `CLAUDE.md` および `.claude/rules/` を参照すること
- 機能仕様: `docs/features/` を参照すること
- 設計方針: `docs/architecture/decisions.md` を参照すること
- バリデーション仕様: `docs/architecture/validations.md` を参照すること
- ローカル開発URL: Web http://localhost:3000 / Docs http://localhost:5173（VitePress 未構築）
- 作業ディレクトリ: `/Users/km/dev/_github/e-be`
- GitHub リポジトリ: https://github.com/qei-2027-700/e-be
- pnpm 9 + Node.js 20 必須
