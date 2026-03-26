# Issue #152: AI Chat ウィジェット — Vercel AI SDK v6 + Gemini 無料枠で実装 (Approach A)

## 背景

DeepAgents（LangChain 製 OSS エージェントフレームワーク）の概念（タスク計画・ツール呼び出し・多段推論）を、
既存の TypeScript/Next.js スタックのまま実現する。
Python サービス不要、Gemini API 無料枠 (gemini-1.5-flash) を使用。
Issue #153（Approach B: DeepAgents Python連携）の前段として検証も兼ねる。

## 参照

- GitHub Issue: #152
- 既存 AI 実装: `apps/web/src/lib/actions/sns-assist.ts`（`GEMINI_API_KEY` の使用パターン）
- 関連ドキュメント: なし（新機能のため）

## 実装方針

- `@ai-sdk/google` の `createGoogleGenerativeAI` で既存の `GEMINI_API_KEY` を再利用
  - `GOOGLE_GENERATIVE_AI_API_KEY` ではなく `GEMINI_API_KEY` を使うため、明示的に `apiKey` を渡す
- API ルートは `/api/chat`（locale プレフィックス不要）
- `streamText` + `toUIMessageStreamResponse` で UI 向けストリーミング
- `convertToModelMessages` は async（v6 仕様）
- フロントは `useChat`（@ai-sdk/react）で `message.parts` を反復表示
- `input` / `handleInputChange` は v6 で削除済み → 自前 `useState` で管理
- `isLoading` は v6 で削除済み → `status === "streaming" || status === "submitted"` で判定

## 実装ステップ

1. **パッケージ追加**
   ```bash
   cd apps/web && pnpm add ai @ai-sdk/react @ai-sdk/google
   ```
   - `ai@^6.0.0`、`@ai-sdk/react@^3.0.0`、`@ai-sdk/google`（最新）

2. **API ルート作成**: `apps/web/src/app/api/chat/route.ts`
   - `createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })` でプロバイダー初期化
   - モデル: `google("gemini-2.5-flash")`（無料枠）
   - system プロンプト: e-be のアシスタントとして日本語で回答
   - Tools（DeepAgents 対応）:
     - `writePlan`: `write_todos` 相当。タイトル + タスクリストを受け取り返却
     - `getCurrentDateTime`: 現在日時を返す
   - `stopWhen: stepCountIs(5)` で多段推論（最大 5 ステップ）
   - `return result.toUIMessageStreamResponse()`

3. **チャットウィジェット作成**: `apps/web/src/components/ai-chat/chat-widget.tsx`
   - `"use client"` ディレクティブ
   - `useChat()` — transport 省略でデフォルト `/api/chat` に POST
   - 自前 `useState<string>` で入力テキスト管理
   - `sendMessage({ text: input })` で送信
   - `status === "streaming" || status === "submitted"` でローディング判定
   - メッセージ表示: `message.parts` を map し:
     - `part.type === "text"` → テキスト表示（`whitespace-pre-wrap`）
     - `part.type === "tool-writePlan"` → 計画リスト表示
     - `part.type === "tool-getCurrentDateTime"` → 日時表示
   - UI: shadcn/ui の `Dialog`（`dialog.tsx`）+ `Button`（`button.tsx`）+ `Textarea`（`textarea.tsx`）
   - フローティングボタン: 画面右下固定（`fixed bottom-6 right-6`）

4. **レイアウトに追加**: `apps/web/src/app/[locale]/layout.tsx`
   - `<ChatWidget />` を `<Toaster>` の直前に追加
   - `NextIntlClientProvider` 内に配置（将来の i18n 対応のため）

## 影響範囲

- `apps/web/package.json` — 依存追加
- `apps/web/pnpm-lock.yaml` — 自動更新
- `apps/web/src/app/api/chat/route.ts` — 新規
- `apps/web/src/components/ai-chat/chat-widget.tsx` — 新規
- `apps/web/src/app/[locale]/layout.tsx` — `<ChatWidget />` 追加のみ

## 注意事項

- `zod` は `drizzle-orm` 経由で既に依存ツリーに存在するが、直接 import するため
  `apps/web/package.json` に追加が必要か確認する（既にあれば不要）
- `message.parts` の tool 部分の `type` は `"tool-{ツール名}"` 形式（v6 仕様）
- API ルートは locale ルーティング外（`app/api/`）に置くため proxy.ts の影響を受けない
- i18n 対応は本 Issue のスコープ外（日本語ハードコードで実装）

## チェックリスト

- [ ] `pnpm add ai @ai-sdk/react @ai-sdk/google` が通る
- [ ] `/api/chat` に POST してストリーミングレスポンスが返る
- [ ] チャットウィジェットがブラウザ右下に表示される
- [ ] テキストメッセージを送信し、Gemini からの返答がストリーミングで表示される
- [ ] `writePlan` ツールが呼び出され、計画リストが UI に表示される
- [ ] ローディング中はボタンが無効化される
- [ ] `pnpm typecheck` がエラーなし
