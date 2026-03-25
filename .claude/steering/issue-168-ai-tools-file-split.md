# Issue #168: AI ツールを lib/ai/tools/ にファイル分割してリファクタリング

## 背景

`apps/web/src/app/api/chat/route.ts`（250行）に AI ツール定義・DB クエリ・バリデーション・system プロンプトが混在している。ツールを追加するたびに 1 ファイルが肥大化する構造で、拡張性・レビュー容易性に問題がある。

## 参照

- GitHub Issue: #168
- `.claude/steering/issue-162-ai-agent-event-creation.md`

## 実装方針

- `lib/ai/tools/` に各ツールを 1 ファイルずつ切り出す
- 各ファイルは AI SDK の `tool()` を使って定義し、そのままエクスポートする
- `index.ts` でまとめて再エクスポートし、route.ts から `import { allTools } from "@/lib/ai/tools"` で使う
- system プロンプトは `lib/ai/system-prompt.ts` に切り出す
- **挙動・入出力インターフェースは一切変えない**（後方互換）
- `dbUser` のような認証情報はツールの `execute` クロージャに渡す形（ファクトリ関数）で対応

## 実装ステップ

1. **`apps/web/src/lib/ai/tools/` ディレクトリを作成**（`mkdir -p` 不要、ファイル作成時に自動生成）

2. **各ツールファイルを作成**

   `write-plan.ts`:
   ```ts
   import { tool } from "ai";
   import { z } from "zod";

   export const writePlanTool = tool({ ... }); // route.ts から切り貼り
   ```

   `get-current-date-time.ts`: 同様

   `list-bars.ts`: `dbUser` を引数に取るファクトリ関数として定義
   ```ts
   export const createListBarsTool = (dbUser: DbUser | null) => tool({ ... });
   ```

   `create-event.ts`: `dbUser` を引数に取るファクトリ関数として定義

3. **`apps/web/src/lib/ai/tools/index.ts` を作成**
   - `dbUser` を受け取り、全ツールをまとめたオブジェクトを返す関数をエクスポート
   ```ts
   export const createTools = (dbUser: DbUser | null) => ({
     writePlan: writePlanTool,
     getCurrentDateTime: getCurrentDateTimeTool,
     listBars: createListBarsTool(dbUser),
     createEvent: createCreateEventTool(dbUser),
   });
   ```

4. **`apps/web/src/lib/ai/system-prompt.ts` を作成**
   - route.ts の system 文字列をそのまま移動してエクスポート

5. **`apps/web/src/app/api/chat/route.ts` をスリム化**
   - ツール定義を削除し、`createTools(dbUser)` と `systemPrompt` を import
   - レート制限ロジックはそのまま残す（今回のスコープ外）

## 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `apps/web/src/app/api/chat/route.ts` | ツール定義・system プロンプトを削除して import に置き換え |
| `apps/web/src/lib/ai/tools/write-plan.ts` | 新規作成 |
| `apps/web/src/lib/ai/tools/get-current-date-time.ts` | 新規作成 |
| `apps/web/src/lib/ai/tools/list-bars.ts` | 新規作成 |
| `apps/web/src/lib/ai/tools/create-event.ts` | 新規作成 |
| `apps/web/src/lib/ai/tools/index.ts` | 新規作成 |
| `apps/web/src/lib/ai/system-prompt.ts` | 新規作成 |

DBスキーマ変更・マイグレーション不要。フロント側変更不要。

## チェックリスト

- [ ] `lib/ai/tools/write-plan.ts` 作成
- [ ] `lib/ai/tools/get-current-date-time.ts` 作成
- [ ] `lib/ai/tools/list-bars.ts` 作成（ファクトリ関数）
- [ ] `lib/ai/tools/create-event.ts` 作成（ファクトリ関数）
- [ ] `lib/ai/tools/index.ts` 作成（`createTools` エクスポート）
- [ ] `lib/ai/system-prompt.ts` 作成
- [ ] `route.ts` スリム化（import 形式に変更）
- [ ] TypeScript エラーなし確認（`pnpm typecheck` or `tsc --noEmit`）
- [ ] チャット動作確認（既存ツールの挙動が変わっていないこと）
