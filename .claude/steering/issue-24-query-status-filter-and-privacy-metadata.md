# Issue #24: 参加クエリのステータスフィルタ追加 + privacy ページの SEO metadata 追加

## 背景

PR #23・#29 のレビューで指摘された2件の小修正をまとめて対応する。

1. `getUpcomingParticipations` / `getParticipationHistory` に `events.status = 'published'` フィルタがなく、cancelled/rejected 状態のイベントへの参加データも表示対象になりうる
2. プライバシーポリシーページに `metadata` がなく SEO 上の問題がある

## 参照

- GitHub Issue: #24（元 Issue: #30 を統合）
- 関連ドキュメント: `docs/features/event-participation.md`
  - ビジネスルール: 参加表明できるのは `published`（開始前）のイベントのみ

## 実装方針

- クエリフィルタは Drizzle の `and()` で既存条件に `eq(events.status, 'published')` を追加する
- `getParticipationHistory` は過去の参加済みイベントを返すため `published` 以外（`completed` 等）も含む設計が自然だが、Issue の指示に従い `published` フィルタを追加する。ただし cancelled/rejected は除外すべき理由が明確なので、設計意図のコメントも追記する
- metadata は Next.js の `export const metadata` を使い、next-intl の翻訳キーには依存せず静的な文字列で定義する（ja/en 切り替え不要なシンプルな対応）

## 実装ステップ

1. `apps/web/src/lib/events.ts` を開き `getUpcomingParticipations` の Drizzle クエリに `eq(events.status, 'published')` を追加
2. 同ファイルの `getParticipationHistory` にも同様のフィルタを追加し、設計意図のコメントを添える
3. `apps/web/src/app/[locale]/privacy/page.tsx` に `export const metadata: Metadata` を追加
   - `title`: `"プライバシーポリシー | E-be"` / `"Privacy Policy | E-be"`（ロケール問わず固定で可）
   - `description`: 簡潔な説明文

## 影響範囲

- `apps/web/src/lib/events.ts`（クエリ2件）
- `apps/web/src/app/[locale]/privacy/page.tsx`（metadata 追加のみ）

## チェックリスト

- [ ] `getUpcomingParticipations` に `eq(events.status, 'published')` を追加
- [ ] `getParticipationHistory` に `eq(events.status, 'published')` を追加 + コメント追記
- [ ] `privacy/page.tsx` に `export const metadata` を追加（title / description）
- [ ] 開発サーバーで privacy ページが正常に表示されることを確認
- [ ] 参加予定・参加履歴ページが正常に表示されることを確認（ランタイムエラーなし）
