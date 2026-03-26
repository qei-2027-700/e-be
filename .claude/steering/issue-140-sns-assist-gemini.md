# Issue #140: feat: イベント詳細ページに主催者向けSNS投稿アシスト機能を追加（Gemini API）

## 背景

イベント詳細ページ（`/dashboard/event/[eventId]`）に、主催者のみ表示される
「SNS投稿を作成」セクションを追加する。
Gemini API でイベント情報から X 投稿文言と画像生成プロンプトを生成する。

## 参照

- GitHub Issue: #140
- 変更対象:
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
  - `apps/web/src/app/[locale]/dashboard/event/[eventId]/sns-assist.tsx`（新規）
  - `apps/web/src/lib/actions/sns-assist.ts`（新規）
  - `apps/web/messages/ja.json` / `en.json`

## 主催者判定

`event.organizerUserId === user.id` で判定する。
`EventDetail` 型に `organizerUserId` は既に含まれている。
`page.tsx` では `user` オブジェクトが取得済みのため、そのまま比較可能。

## 実装方針

### Server Action (`apps/web/src/lib/actions/sns-assist.ts`)

```ts
"use server";
// Gemini API を呼び出し、X投稿文言と画像生成プロンプトを返す
export async function generateSnsContent(eventId: string): Promise<{
  xPost: string;
  imagePrompt: string;
} | { error: string }>
```

- `GEMINI_API_KEY` 環境変数から API キーを取得
- キーがない場合はエラーを返す
- `@google/generative-ai` パッケージを使用
- モデル: `gemini-2.5-flash`
- イベント情報（タイトル・日時・場所・説明）を元にプロンプトを構築
- 1回のリクエストで X 投稿文言と画像生成プロンプトの両方を生成（JSON レスポンス）

プロンプト例:
```
以下のイベント情報を元に、2つのコンテンツを JSON 形式で生成してください。

イベント情報:
- タイトル: {title}
- 日時: {startAt}
- 場所: {location}
- 説明: {description}

出力形式（JSON のみ）:
{
  "xPost": "X（Twitter）投稿文言（140文字以内、ハッシュタグ含む）",
  "imagePrompt": "SNS画像生成用英語プロンプト（Midjourney/DALL-E向け）"
}
```

### Client Component (`apps/web/src/app/[locale]/dashboard/event/[eventId]/sns-assist.tsx`)

```tsx
"use client";
// 「生成する」ボタン → Server Action 呼び出し → 結果表示 + コピーボタン
export function SnsAssist({ eventId }: { eventId: string })
```

- 「生成する」ボタン押下で `generateSnsContent(eventId)` を呼び出し
- ローディング中はスピナー表示
- 結果表示エリア（X投稿文言 / 画像生成プロンプト）
- 各結果に「コピー」ボタン（`navigator.clipboard.writeText`）
- エラー時はエラーメッセージを表示

### ページへの組み込み (`page.tsx`)

```tsx
{event.organizerUserId === user.id && (
  <SnsAssist eventId={event.id} />
)}
```

## 実装ステップ

1. `apps/web/package.json` に `@google/generative-ai` を追加
   ```bash
   pnpm --filter web add @google/generative-ai
   ```

2. `apps/web/src/lib/actions/sns-assist.ts` を新規作成
   - Gemini API 呼び出し Server Action

3. `apps/web/src/app/[locale]/dashboard/event/[eventId]/sns-assist.tsx` を新規作成
   - Client Component（ボタン・ローディング・結果表示・コピーボタン）

4. `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` を更新
   - 主催者判定して `<SnsAssist>` を表示

5. `apps/web/messages/ja.json` / `en.json` に翻訳キーを追加

6. `.env.local` に `GEMINI_API_KEY=` を追記（値はユーザーが設定）

## 翻訳キー（`event_detail` 名前空間に追加）

```json
{
  "sns_assist_title": "SNS投稿を作成",
  "sns_assist_generate": "生成する",
  "sns_assist_generating": "生成中...",
  "sns_assist_x_post": "X（Twitter）投稿文言",
  "sns_assist_image_prompt": "画像生成プロンプト",
  "sns_assist_copy": "コピー",
  "sns_assist_copied": "コピーしました",
  "sns_assist_error": "生成に失敗しました。再度お試しください。"
}
```

## フォールバック策

| 状況 | 挙動 |
|------|------|
| `GEMINI_API_KEY` 未設定 | セクション自体を非表示にする（Server Component で判定） |
| API 呼び出しエラー（ネットワーク・レート制限等） | エラーメッセージを表示し「再試行」ボタンを表示 |
| レスポンスが JSON パース失敗 | エラーメッセージを表示 |

`GEMINI_API_KEY` 未設定の場合はセクションごと非表示にすることで、
キーを持っていないユーザーには何も見えず、UX を壊さない。

```tsx
// page.tsx（Server Component）
const canUseAI = !!process.env.GEMINI_API_KEY;

{canUseAI && event.organizerUserId === user.id && (
  <SnsAssist eventId={event.id} />
)}
```



- `GEMINI_API_KEY` — Google AI Studio で発行した API キー
  - ローカル: `apps/web/.env.local` に追記
  - 本番: Vercel Environment Variables に登録

## 受け入れ条件

- [ ] 主催者のみ「SNS投稿を作成」セクションが表示される
- [ ] 「生成する」ボタンで X 投稿文言と画像生成プロンプトが生成される
- [ ] 各結果にコピーボタンがある
- [ ] `GEMINI_API_KEY` が未設定の場合はエラーメッセージを表示
- [ ] API キーはコードに直書きしない

## 影響範囲

- `apps/web/package.json`（`@google/generative-ai` 追加）
- `apps/web/src/lib/actions/sns-assist.ts`（新規）
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/sns-assist.tsx`（新規）
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`
- `apps/web/messages/ja.json` / `en.json`
