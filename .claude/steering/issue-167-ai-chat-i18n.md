# Issue #167: AI chat widget の i18n 対応（ハードコード日本語テキスト＋locale パス）

## 背景

`chat-widget.tsx` および `tool-results/` 配下のコンポーネントに日本語テキストが直書きされている。
また `create-event-result.tsx` と `update-event-result.tsx` の編集リンクが `/ja/dashboard/...` と
locale プレフィックスをハードコードしている。

`.claude/rules/i18n.md` の方針に従い、`next-intl` の `useTranslations` で翻訳キーに置き換える。

## 参照

- GitHub Issue: #167
- i18n ルール: `.claude/rules/i18n.md`
- 翻訳ファイル: `apps/web/messages/ja.json` / `apps/web/messages/en.json`
- 対象コンポーネント（5ファイル）:
  - `apps/web/src/components/ai-chat/chat-widget.tsx`
  - `apps/web/src/components/ai-chat/tool-results/create-event-result.tsx`
  - `apps/web/src/components/ai-chat/tool-results/update-event-result.tsx`
  - `apps/web/src/components/ai-chat/tool-results/write-plan-result.tsx`（要確認）
  - `apps/web/src/components/ai-chat/tool-results/get-current-date-time-result.tsx`（要確認）

## 抽出が必要なテキスト一覧

### chat-widget.tsx

| 現在のハードコード文字列 | キー候補 |
|--------------------------|---------|
| `"考え中..."` | `aiChat.thinking` |
| `"試験運用中"` | `aiChat.beta` |
| `"e-be AIアシスタント"` | `aiChat.assistantName` |
| `"イベント企画・集客・運営について\nなんでも聞いてください"` | `aiChat.welcomeMessage` |
| `"本日の残り: {remaining} / {limit} token"` | `aiChat.remainingTokens` |
| `"本日のトークン上限（{limit} token）に達しました。明日またご利用ください。"` | `aiChat.limitReached` |
| `"メッセージを入力... (Enter で送信)"` | `aiChat.inputPlaceholder` |
| `"試験的機能 · Gemini 2.5 Flash"` | `aiChat.footer` |
| `"本日 {used}/{limit} token"` | `aiChat.tokenUsage` |
| `"コピー"` (aria-label) | `aiChat.copy` |
| `"チャットを閉じる"` (aria-label) | `aiChat.close` |
| `"AIチャットを開く"` (aria-label) | `aiChat.open` |

### create-event-result.tsx

| 現在のハードコード文字列 | キー候補 |
|--------------------------|---------|
| `"イベントの作成に失敗しました（{error}）"` | `aiChat.tool.createEvent.error` |
| `"下書きを作成しました"` | `aiChat.tool.createEvent.success` |
| `"イベント編集画面を開く"` | `aiChat.tool.createEvent.openEdit` |

### update-event-result.tsx

| 現在のハードコード文字列 | キー候補 |
|--------------------------|---------|
| `"修正に失敗しました（{msg}）"` | `aiChat.tool.updateEvent.error` |
| `"下書きを修正しました"` | `aiChat.tool.updateEvent.success` |
| `"イベント編集画面を開く"` | `aiChat.tool.updateEvent.openEdit` |
| `ERROR_MESSAGES` の各文字列 | `aiChat.tool.updateEvent.errors.*` |

## locale パスのハードコード問題

`create-event-result.tsx` と `update-event-result.tsx` のリンクが `/ja/dashboard/event/{id}/edit` と
ロケールを固定している。`useLocale()` (next-intl) でロケールを取得し動的に組み立てる。

```tsx
import { useLocale } from "next-intl";
const locale = useLocale();
// href={`/${locale}/dashboard/event/${output.eventId}/edit`}
```

## 実装ステップ

1. **翻訳キーを messages/ja.json に追加**
   ```json
   {
     "aiChat": {
       "thinking": "考え中...",
       "beta": "試験運用中",
       "assistantName": "e-be AIアシスタント",
       "welcomeMessage": "イベント企画・集客・運営について\nなんでも聞いてください",
       "remainingTokens": "本日の残り: {remaining} / {limit} token",
       "limitReached": "本日のトークン上限（{limit} token）に達しました。明日またご利用ください。",
       "inputPlaceholder": "メッセージを入力... (Enter で送信)",
       "footer": "試験的機能 · Gemini 2.5 Flash",
       "tokenUsage": "本日 {used}/{limit} token",
       "copy": "コピー",
       "close": "チャットを閉じる",
       "open": "AIチャットを開く",
       "tool": {
         "createEvent": {
           "error": "イベントの作成に失敗しました（{error}）",
           "success": "下書きを作成しました",
           "openEdit": "イベント編集画面を開く"
         },
         "updateEvent": {
           "error": "修正に失敗しました（{msg}）",
           "success": "下書きを修正しました",
           "openEdit": "イベント編集画面を開く",
           "errors": {
             "unauthorized": "ログインが必要です",
             "forbidden": "このイベントを修正する権限がありません",
             "not_found": "イベントが見つかりません",
             "not_draft": "下書き以外のイベントは修正できません",
             "invalid_title": "タイトルが無効です（最大100文字）",
             "invalid_description": "説明が無効です（最大2000文字）",
             "invalid_start_at": "開始日時の形式が無効です",
             "invalid_end_at": "終了日時の形式が無効です",
             "invalid_date_range": "終了日時は開始日時より後に設定してください"
           }
         }
       }
     }
   }
   ```

2. **messages/en.json に英語訳を追加**
   ```json
   {
     "aiChat": {
       "thinking": "Thinking...",
       "beta": "Beta",
       "assistantName": "e-be AI Assistant",
       "welcomeMessage": "Ask me anything about event planning,\npromotion, and management.",
       "remainingTokens": "Today's remaining: {remaining} / {limit} tokens",
       "limitReached": "You've reached today's token limit ({limit} tokens). Please try again tomorrow.",
       "inputPlaceholder": "Type a message... (Enter to send)",
       "footer": "Experimental · Gemini 2.5 Flash",
       "tokenUsage": "Today {used}/{limit} tokens",
       "copy": "Copy",
       "close": "Close chat",
       "open": "Open AI chat",
       "tool": {
         "createEvent": {
           "error": "Failed to create event ({error})",
           "success": "Draft created",
           "openEdit": "Open event editor"
         },
         "updateEvent": {
           "error": "Failed to update ({msg})",
           "success": "Draft updated",
           "openEdit": "Open event editor",
           "errors": {
             "unauthorized": "Login required",
             "forbidden": "You don't have permission to edit this event",
             "not_found": "Event not found",
             "not_draft": "Only draft events can be edited",
             "invalid_title": "Invalid title (max 100 characters)",
             "invalid_description": "Invalid description (max 2000 characters)",
             "invalid_start_at": "Invalid start date/time format",
             "invalid_end_at": "Invalid end date/time format",
             "invalid_date_range": "End date/time must be after start date/time"
           }
         }
       }
     }
   }
   ```

3. **chat-widget.tsx を修正**
   - `import { useTranslations } from "next-intl"` を追加
   - `const t = useTranslations("aiChat")` を `ChatWidget` 内で呼ぶ
   - ハードコード文字列を `t("thinking")` 等に置き換え
   - 変数埋め込みは `t("remainingTokens", { remaining: ..., limit: ... })` の形式

4. **create-event-result.tsx を修正**
   - `useTranslations("aiChat.tool.createEvent")` を使う
   - `useLocale()` でロケールを取得してリンクパスを動的生成

5. **update-event-result.tsx を修正**
   - `useTranslations("aiChat.tool.updateEvent")` を使う
   - `ERROR_MESSAGES` マップを `t("errors.{key}")` に置き換え
   - `useLocale()` でリンクパスを動的生成

6. **残りの tool-result ファイルを確認**
   - `write-plan-result.tsx` と `get-current-date-time-result.tsx` を読み、
     ハードコード文字列があれば同様に対応

## 注意事項

- tool-results コンポーネントは `"use client"` なので `useTranslations` と `useLocale` はそのまま使える
- `chat-widget.tsx` も `"use client"` なので同様
- `next-intl` の `useTranslations` を使うには、コンポーネントが `NextIntlClientProvider` の子孫である必要がある
  - `chat-widget.tsx` は `[locale]/layout.tsx` の `NextIntlClientProvider` 内に配置済みなので問題なし
- `t()` に渡す変数キーは `{camelCase}` 形式（next-intl の ICU message format）

## 影響範囲

- `apps/web/messages/ja.json` — `aiChat` セクション追加
- `apps/web/messages/en.json` — `aiChat` セクション追加
- `apps/web/src/components/ai-chat/chat-widget.tsx`
- `apps/web/src/components/ai-chat/tool-results/create-event-result.tsx`
- `apps/web/src/components/ai-chat/tool-results/update-event-result.tsx`
- `apps/web/src/components/ai-chat/tool-results/write-plan-result.tsx`（要確認）
- `apps/web/src/components/ai-chat/tool-results/get-current-date-time-result.tsx`（要確認）

## チェックリスト

- [ ] `messages/ja.json` に `aiChat` セクションが追加されている
- [ ] `messages/en.json` に `aiChat` セクションが追加されている（英語訳）
- [ ] `chat-widget.tsx` にハードコード日本語文字列が残っていない
- [ ] `create-event-result.tsx` のリンクが `useLocale()` でロケールを動的取得している
- [ ] `update-event-result.tsx` のリンクが `useLocale()` でロケールを動的取得している
- [ ] `/ja` の locale ハードコードがコンポーネント内に残っていない
- [ ] `pnpm typecheck` がエラーなし
- [ ] ロケールを `/en` に切り替えて英語表示になることを確認
