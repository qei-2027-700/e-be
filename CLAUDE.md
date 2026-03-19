# E-be — Claude Code 開発ガイドライン

## UI・インタラクション

- クリック・hover可能な要素（Button、Card、Link等）には必ず **hover/active の視覚的フィードバック** を付ける
  - 例: `transition-all duration-200 hover:scale-105 hover:shadow-md`
  - 例: `hover:-translate-y-0.5 hover:bg-muted/50`
- クリッカブルな要素（Button、Card、Link、badge等）には **`cursor-pointer` を必須** とする
- アニメーションは `duration-200` を基本とし、過剰にしない

## モバイルファースト

- **モバイルファーストで実装する**。Tailwind のレスポンシブ修飾子はモバイルが基底
  - ✅ `text-sm md:text-base` — モバイル小、PC大
  - ❌ `text-base md:text-sm` — これはモバイルファーストではない
- レイアウトは `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` のように積み上げる
- タップターゲットは最低 44px（`min-h-11` 相当）を確保する
- hover 効果はタッチデバイスで意図せず残らないよう `@media (hover: hover)` を意識する
  - shadcn/ui のコンポーネントはこれを考慮済み
- このプロジェクトは Web (Next.js) と Mobile (Expo) の両方で展開する

## 多言語対応（i18n）

- このサービスは **日本語・英語の2言語対応** を前提とする
- UI に文字列をハードコードしない。必ず翻訳キーを通す
- Web (Next.js): **`next-intl`** を使用
  - メッセージファイル: `messages/ja.json` / `messages/en.json`
  - デフォルト言語: 日本語 (`ja`)
  - URL構造: `/ja/...` / `/en/...`
- Mobile (Expo): **`i18next` + `react-i18next`** を使用
- 新しいUIテキストを追加する際は必ず `ja` と `en` の両方を `messages/*.json` に追加する
- 日付・数値フォーマットも `Intl` API を使ってロケール対応する

## 課金・プラン設計

- プランは `'free' | 'premium'` の2種類を前提とする（将来拡張可）
- **機能制限の判定は必ず `canUseFeature(user, feature)` を通す**。コンポーネントやAPIに直接 `user.plan === 'premium'` を書かない
- DB スキーマの `users` / `organizations` には `stripe_customer_id`・`plan`・`plan_expires_at` 列を最初から含める
- 課金処理は **Stripe**（Vercel Marketplace）を使う想定。導入前でも列だけ先に用意する
- Stripe Webhook で `plan` 列を更新する設計にする（UI から直接 plan を書き換えない）

## アーキテクチャ実装ルール

### ソフトデリート
- **全テーブルに `deleted_at` 列を必ず入れる**。`DELETE` 文は使わない
- クエリは常に `WHERE deleted_at IS NULL` を付ける（Drizzle のデフォルトスコープで実装）

### タイムゾーン
- **DB には必ず UTC で保存する**（`timestamp with time zone` 型）
- 表示時は `Intl.DateTimeFormat` でユーザーのロケールに変換する
- コンポーネントに `new Date()` をそのまま渡さない

### イベントステートマシン
- ステータス遷移は `packages/db/src/event-transitions.ts` の `canTransition(from, to)` を通す
- 直接 `event.status = 'approved'` のように書かない

### 通知
- 通知送信は `notify(userId, type, payload)` を通す。Expo Push / Email を直接呼ばない
- 通知タイプは `packages/db/src/notification-types.ts` で一元管理する

### ファイルストレージ
- Supabase Storage のパス構造: `{type}/{orgId}/{entityId}/{filename}`
  - 例: `events/{orgId}/{eventId}/banner.webp`
  - 例: `users/{userId}/avatar.webp`
- パスを自前で組み立てない。必ずヘルパー関数を経由する

### 監査ログ
- イベント承認・キャンセル・ロール変更など主要操作は `audit_logs` テーブルに記録する
- Server Action / Route Handler の中で直接 insert する（ミドルウェアで自動化しない）

## コーディング規約

- コンポーネントは shadcn/ui を優先して使う（素の HTML + Tailwind で自作しない）
- `'use client'` は必要最小限。Server Components をデフォルトとする
- TailwindCSS クラスは可読性重視（1行に詰め込みすぎない）

## ディレクトリ構成

- `apps/web` — Next.js 16 Web アプリ
- `docs/` — VitePress ドキュメントサイト（GitHub Pages 公開）
- `packages/db` — Drizzle ORM スキーマ（Web/Mobile 共有）
- `.claude/steering/` — AI生成の実装計画書
