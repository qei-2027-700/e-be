# Issue #174: AIチャット履歴の永続化（ブラウザリフレッシュ後もコンテキスト維持）

## 背景

現在のAIチャット（`apps/web/src/app/api/chat/route.ts`）はクライアントが持つインメモリの`messages`配列のみで動作しており、ブラウザリフレッシュや再アクセス時にコンテキストが消える。チャットメッセージをDBに永続化し、次回アクセス時に復元することで長期コンテキストを維持する。

## 参照

- GitHub Issue: #174
- 関連ドキュメント: なし（AI機能専用ドキュメントは未作成）
- `docs/architecture/decisions.md` — #1 ソフトデリート、#2 UTCタイムスタンプ方針

## 実装方針

- **1ユーザー1セッション**: `chatSessions` にユーザーIDでユニーク制約。セッションがなければ自動生成する
- **parts をそのまま保存**: AI SDK の `UIMessage.parts`（`jsonb`）をそのまま保存することで、テキスト・ツール呼び出し・添付ファイルも汎用的に対応
- **直近20件に絞る**: AI への送信は `convertToModelMessages` に渡す前に最新20件に制限。トークン超過を防ぐ
- **未認証ユーザーはスキップ**: 保存・取得とも `dbUser` が存在する場合のみ実行（現状と同様）
- **ソフトデリート**: `deletedAt` で論理削除（decisions.md #1 に従う）

## 実装ステップ

1. **スキーマ追加** (`packages/db/src/schema.ts`)
   - `chatSessions` テーブル（`id`, `userId` unique, `createdAt`, `updatedAt`, `deletedAt`）
   - `chatMessages` テーブル（`id`, `sessionId`, `role`, `parts` jsonb, `createdAt`, `deletedAt`）

2. **マイグレーション生成・適用**
   ```bash
   # packages/db ディレクトリで
   pnpm db:generate
   pnpm db:migrate
   ```

3. **API Route 修正** (`apps/web/src/app/api/chat/route.ts`)
   - `GET`: `dbUser` がいれば `chatMessages` を最新20件取得して返す（セッションがなければ空配列）
   - `POST`:
     - `dbUser` がいれば `chatSessions` を upsert（userId で競合したら updatedAt だけ更新）
     - ユーザーメッセージを保存（`role: 'user'`）
     - `streamText` の `onFinish` コールバックでAIレスポンスを保存（`role: 'assistant'`）

4. **フロントエンド修正** (`apps/web/src/components/ai-chat/` 配下)
   - ページロード時に `GET /api/chat` で履歴を取得
   - `useChat({ initialMessages: history })` に渡す

## 影響範囲

- `packages/db/src/schema.ts` — テーブル追加
- `packages/db/src/migrations/` — 新規マイグレーションファイル
- `apps/web/src/app/api/chat/route.ts` — GET ハンドラ追加・POST に保存処理追加
- `apps/web/src/components/ai-chat/` — 履歴ロード・`initialMessages` への受け渡し（コンポーネント構造要確認）

## チェックリスト

- [ ] `chatSessions` / `chatMessages` テーブルが schema.ts に追加されている
- [ ] マイグレーションが生成・適用されている
- [ ] `GET /api/chat` が履歴（最新20件）を返す
- [ ] `POST /api/chat` でユーザー発言・AIレスポンスが保存される
- [ ] ブラウザリフレッシュ後に以前の会話が復元される
- [ ] 未認証ユーザーでは履歴保存・取得が走らない
- [ ] `deletedAt` によるソフトデリートが適用されている
