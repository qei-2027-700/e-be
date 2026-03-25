# Issue #162: AI agent機能：イベント作成

## 背景

現状のAIチャット（e-be AI）はイベントに関する質問・相談には答えられるが、実際のイベント作成・公開はできない。
ユーザーが「3/27日にイベントを開催するので作成・公開して」と依頼した際に「管理画面から操作してください」と返すしかない状態。

チャットから直接イベントを作成できる **Agent 機能** を追加することで、会話ベースのイベント作成フローを実現する。

## 参照

- `docs/features/event-creation.md` — イベント作成フローの全仕様（バリデーション・ステータス遷移）
- `apps/web/src/components/ai-chat/chat-widget.tsx` — 既存チャット UI（AI SDK `useChat` + tool result レンダリング）
- `apps/web/src/app/api/chat/route.ts` — 既存チャット API（Gemini 2.5 Flash、`streamText` + tool定義）
- `apps/web/src/lib/actions/event.ts` — Server Actions: `createEventDraft` / `updateEventDraft` / `publishEvent`
- `packages/db/src/schema.ts` — `events` テーブル定義

### events テーブルの主要カラム

| カラム | 型 | 備考 |
|--------|-----|------|
| orgId | uuid | バー（必須） |
| userId | uuid | 作成者（必須） |
| status | enum | `draft` / `pending` / `published` |
| title | text | 最大100文字 |
| description | text | 最大2000文字 |
| startAt | timestamp | draft時は任意 |
| endAt | timestamp | draft時は任意 |
| maxParticipants | integer | 1〜500、null=定員なし |
| chargeAmount | integer | 0=無料、null=未設定 |

## 実装方針

### Agent ツール設計

チャット API（`/api/chat/route.ts`）に以下のツールを追加する。

#### 1. `createEvent` ツール
- チャットから `draft` イベントを作成する
- 呼び出し前に必須項目（orgId・title・description）が揃っているかを AI が確認する
- DBへの書き込みは既存の `createEventDraft` Server Action のロジックを **直接 DB 操作**（`db.insert`）として route.ts 内で再実装する（Server Action は "use server" のため API route から直接呼び出せない）
- 返り値: `{ eventId, title, status: 'draft' }` or `{ error: string }`

#### 2. `listBars` ツール
- ユーザーが利用可能なバー（organizations）の一覧を返す
- `barHostPermissions` から認可済みバー、またはすべてのアクティブなバーを返す
- 返り値: `{ bars: { id, name }[] }`

#### 3. `getEventDetail` ツール（任意・フェーズ2）
- 作成済みイベントの詳細を返す
- 返り値: イベント基本情報

### 認証の扱い

- `/api/chat/route.ts` はサーバーサイドなので `getDbUser()` でセッションユーザーを取得できる
- イベント作成前にユーザー認証・userType チェック（`user` のみ作成可）を行う

### UI（chat-widget.tsx）

- `tool-createEvent` パートが `output-available` になったら、作成結果カードを表示する
  - 成功: イベントタイトル・ステータス・「イベント詳細を見る」リンク
  - 失敗: エラーメッセージ
- `tool-listBars` パートは UI 表示不要（中間ツール）、または折りたたみ表示

### system プロンプト更新

ツール追加に合わせ、以下を system プロンプトに追記：
- `createEvent` ツールが使えること
- イベント作成前に必ず必須情報（バー・タイトル・説明）を確認すること
- 日時が明示されていれば startAt / endAt をセットすること
- `draft` で作成するため、作成後にユーザーが申請・公開操作が必要な場合があることを説明すること

## 実装ステップ

1. **`/api/chat/route.ts` にツール追加**
   - `listBars`: セッションユーザーが主催者として利用できるバー一覧を DB から取得
   - `createEvent`: 必須バリデーション → `db.insert(events)` で draft 作成 → eventId 返却
   - system プロンプトを更新

2. **`chat-widget.tsx` に tool result UI を追加**
   - `tool-createEvent` の output-available 時に結果カードをレンダリング
   - 成功カードにはイベント詳細ページへのリンクを含める

3. **認証・セキュリティ**
   - route.ts 内で `getDbUser()` → userType 確認 → forbidden なら tool がエラーを返す
   - orgId バリデーション（UUID形式チェック）
   - title 最大100文字 / description 最大2000文字

4. **i18n 対応**
   - チャット内のメッセージは日本語固定（既存の system プロンプトが日本語）
   - tool result カード内の静的テキストは日本語で直書き可

5. **動作確認**
   - テストアカウント（`test-user@e-be.internal`）でチャットから「イベントを作成して」と入力
   - AI がバー選択・タイトル・説明を会話で確認 → `createEvent` ツール呼び出し → 結果カード表示

## 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `apps/web/src/app/api/chat/route.ts` | ツール追加・system プロンプト更新 |
| `apps/web/src/components/ai-chat/chat-widget.tsx` | tool result UI 追加 |

DBスキーマ変更・マイグレーション不要。既存の Server Actions（event.ts）は変更しない。

## チェックリスト

- [ ] `listBars` ツール実装（認証済みユーザーのバー一覧取得）
- [ ] `createEvent` ツール実装（バリデーション + DB insert + eventId 返却）
- [ ] system プロンプト更新（ツール説明・確認フロー）
- [ ] `chat-widget.tsx` に `tool-createEvent` result カード UI 追加
- [ ] 認証チェック（未ログイン・venue_user は createEvent をエラー返し）
- [ ] 動作確認（Playwright MCP）
