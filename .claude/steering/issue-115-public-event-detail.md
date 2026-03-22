# Issue #115: feat: イベント詳細ページを未ログインでも閲覧可能にする

## 背景

現在 `/[locale]/dashboard/event/[eventId]` は dashboard layout 配下にあり、未ログインユーザーはサインイン画面にリダイレクトされる。公開イベント一覧（/events）から詳細へ遷移したとき、ログインを強制される UX を改善する。

## 参照

- GitHub Issue: #115
- 関連ドキュメント:
  - `docs/features/event-search.md`（イベント詳細の表示項目定義）
  - `docs/features/event-participation.md`（参加ボタンのビジネスルール）

## 実装方針

- `proxy.ts` の `PUBLIC_PATHS` には既に `/events` が含まれているため、サブパス `/events/:id` も自動的に公開済み（`startsWith` 判定）。追加不要。
- public 向けの新ページ `apps/web/src/app/[locale]/events/[eventId]/page.tsx` を新規作成する。
- 既存の `getEventDetail(eventId, userId)` は `userId` が必須だが、未ログインユーザー対応のため `userId` を optional にする。
- 未ログインユーザーには「サインインして参加する」ボタン（サインインページへリンク）を表示する。
- `/events` 一覧のリンク先を `/dashboard/event/:id` → `/events/:id` に変更する。
- 既存の `/dashboard/event/:id`（ログイン済み向け）はそのまま残す。

## 実装ステップ

1. **`apps/web/src/lib/events.ts`**: `getEventDetail` の第2引数 `userId` を optional（`userId?: string`）に変更。`leftJoin` の条件も `userId` が undefined の場合は参加状態を取得しないよう調整する。

2. **`apps/web/src/app/[locale]/events/[eventId]/page.tsx`（新規）**: public イベント詳細ページを作成する。
   - `PublicHeader` を使用（`isLoggedIn` を渡す）
   - `AppFooter` を使用
   - `getUser()` で未ログイン判定（null の場合は `myParticipationStatus` を null 扱い）
   - 未ログイン時は参加ボタンの代わりに「サインインして参加する」ボタンを表示（`/${locale}/auth/sign-in?next=/${locale}/events/${eventId}` にリンク）
   - 表示項目：タイトル・説明・日時・場所・チャージ料・定員・参加者数・主催者Xリンク
   - ログイン済み時は既存の `ParticipationButton` を使用

3. **`apps/web/src/app/[locale]/events/page.tsx`**: イベント一覧のリンク先を `/dashboard/event/:id` → `/events/:id` に変更する（行 94）。

4. **翻訳追加**: `apps/web/messages/ja.json` と `en.json` に必要なキーを追加。
   - `event_detail.back_to_events`（「イベント一覧へ戻る」）
   - `event_detail.sign_in_to_join`（「サインインして参加する」）

## 影響範囲

- `apps/web/src/app/[locale]/events/[eventId]/page.tsx`（新規）
- `apps/web/src/app/[locale]/events/page.tsx`（リンク先変更）
- `apps/web/src/lib/events.ts`（`getEventDetail` の `userId` を optional に）
- `apps/web/messages/ja.json` / `en.json`（翻訳キー追加）
- `proxy.ts` は**変更不要**（`/events` が既に PUBLIC_PATHS に含まれ、サブパスも公開済み）

## チェックリスト

- [ ] `getEventDetail` が `userId` なしで動作する（参加状態は null を返す）
- [ ] `/events/:id` が未ログインでアクセス可能（リダイレクトされない）
- [ ] 未ログイン時に「サインインして参加する」ボタンが表示される
- [ ] ログイン済み時に `ParticipationButton` が正常に動作する
- [ ] `/events` 一覧のリンクが `/events/:id` に変更されている
- [ ] `/dashboard/event/:id` は引き続きログイン済み向けに動作する
- [ ] `ja.json` と `en.json` に翻訳キーが追加されている
- [ ] Playwright で未ログイン状態でのアクセス動作を確認済み
