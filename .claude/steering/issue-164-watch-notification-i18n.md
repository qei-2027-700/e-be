# Issue #164: watch通知のタイトル・本文をi18n対応する

## 背景

`apps/web/src/lib/actions/event.ts` の publish 処理内で、watch通知のタイトル・本文が日本語ハードコード。
英語ユーザーにも日本語で通知が届いてしまう。

```ts
// 現状（ハードコード）
const title = target.title?.trim() ? `イベントが公開されました: ${target.title}` : 'イベントが公開されました';
const body = 'watch中の主催者がイベントを公開しました。';
```

## 参照

- GitHub Issue: #164
- 対象ファイル: `apps/web/src/lib/actions/event.ts`
- i18n ルール: `.claude/rules/i18n.md`
- 翻訳ファイル: `apps/web/messages/ja.json` / `apps/web/messages/en.json`

## 実装方針

**MVP アプローチ**: `getLocale()` (next-intl/server) でリクエストコンテキストのロケールを取得し、
そのロケールで翻訳テキストを生成する。
- 受信者ごとのロケール個別対応は `users.preferredLocale` カラム追加が必要なため将来課題
- 現状はイベント公開者のロケールで通知文を生成する（日本語ユーザーが公開 → 日本語通知）

## 実装ステップ

1. **翻訳キーを追加** (`messages/ja.json`)
   ```json
   {
     "notifications": {
       "watchedOrganizerEventPublished": {
         "title": "イベントが公開されました: {eventTitle}",
         "titleNoName": "イベントが公開されました",
         "body": "watch中の主催者がイベントを公開しました。"
       }
     }
   }
   ```

2. **翻訳キーを追加** (`messages/en.json`)
   ```json
   {
     "notifications": {
       "watchedOrganizerEventPublished": {
         "title": "New event published: {eventTitle}",
         "titleNoName": "New event published",
         "body": "An organizer you're watching published a new event."
       }
     }
   }
   ```

3. **event.ts を修正**
   - `import { getLocale, getTranslations } from 'next-intl/server'` を追加
   - `await getLocale()` でロケール取得
   - `await getTranslations({ locale, namespace: 'notifications.watchedOrganizerEventPublished' })` で翻訳取得
   - ハードコード文字列を `t('title', { eventTitle: target.title })` / `t('titleNoName')` / `t('body')` に置き換え

## 注意事項

- `getLocale()` は Server Action のリクエストコンテキスト内で呼べる（`auth.ts` で実績あり）
- `getTranslations` に namespace ドット区切りで深いキーを渡す場合は `namespace: 'notifications'` として `t('watchedOrganizerEventPublished.title', ...)` のように使う方が安全
- event title が空/undefined の場合は `titleNoName` キーを使う

## 影響範囲

- `apps/web/messages/ja.json` — `notifications` セクション追加
- `apps/web/messages/en.json` — `notifications` セクション追加
- `apps/web/src/lib/actions/event.ts` — getLocale/getTranslations を使うよう変更

## チェックリスト

- [ ] `messages/ja.json` に `notifications.watchedOrganizerEventPublished` キーが追加されている
- [ ] `messages/en.json` に `notifications.watchedOrganizerEventPublished` キーが追加されている（英語訳）
- [ ] `event.ts` にハードコード日本語文字列が残っていない
- [ ] `pnpm typecheck` で新規エラーがない
