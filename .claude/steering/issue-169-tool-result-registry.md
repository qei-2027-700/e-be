# Issue #169: チャットのツール結果表示をレジストリパターンにリファクタリング

## 背景

`chat-widget.tsx` のツール結果レンダリングが `if (part.type === "tool-xxx")` の連鎖構造になっており、ツールを追加するたびに chat-widget.tsx を直接編集する必要がある。また `(part as any).output` と型キャストしており型安全性がない。

## 参照

- GitHub Issue: #169
- Issue #168（AI ツールファイル分割）と同時対応

## 実装方針

- `components/ai-chat/tool-results/` に各ツールの結果 UI コンポーネントを 1 ファイルずつ切り出す
- `tool-results/index.tsx` に `toolResultRegistry: Record<string, React.ComponentType>` を定義
- `chat-widget.tsx` は `toolResultRegistry[part.type]` を参照するだけにする
- **既存の UI（見た目）は変えない**
- 型安全性確保：`(part as any)` をなくす。AI SDK の `ToolInvocationUIPart` 型を利用する

## 実装ステップ

1. **`apps/web/src/components/ai-chat/tool-results/` ディレクトリ作成**

2. **各ツール結果コンポーネントを作成**

   `write-plan-result.tsx`:
   ```tsx
   import type { ToolInvocationUIPart } from "ai";

   type Props = { part: ToolInvocationUIPart };

   export function WritePlanResult({ part }: Props) {
     if (part.state !== "output-available") return null;
     const output = part.output as { title: string; todos: string[]; createdAt: string };
     // chat-widget.tsx から UI をそのまま移動
   }
   ```

   `get-current-date-time-result.tsx`: 同様

   `create-event-result.tsx`: 同様

3. **`tool-results/index.tsx` にレジストリを定義**
   ```tsx
   import type { ToolInvocationUIPart } from "ai";
   import { WritePlanResult } from "./write-plan-result";
   import { GetCurrentDateTimeResult } from "./get-current-date-time-result";
   import { CreateEventResult } from "./create-event-result";

   type ToolResultProps = { part: ToolInvocationUIPart };

   export const toolResultRegistry: Record<
     string,
     React.ComponentType<ToolResultProps>
   > = {
     "tool-writePlan": WritePlanResult,
     "tool-getCurrentDateTime": GetCurrentDateTimeResult,
     "tool-createEvent": CreateEventResult,
   };
   ```

4. **`chat-widget.tsx` の parts レンダリングを置き換え**
   ```tsx
   // Before
   if (part.type === "tool-writePlan" && ...) { ... }
   if (part.type === "tool-getCurrentDateTime" && ...) { ... }
   if (part.type === "tool-createEvent" && ...) { ... }

   // After
   const ToolResult = toolResultRegistry[part.type];
   if (ToolResult) return <ToolResult key={i} part={part as ToolInvocationUIPart} />;
   ```

   - `ToolWritePlanOutput` / `ToolGetCurrentDateTimeOutput` / `ToolCreateEventOutput` 型定義も各コンポーネントファイルに移動

## 影響範囲

| ファイル | 変更種別 |
|---------|---------|
| `apps/web/src/components/ai-chat/chat-widget.tsx` | ツール結果 if ブロックを削除、レジストリ参照に置き換え |
| `apps/web/src/components/ai-chat/tool-results/write-plan-result.tsx` | 新規作成 |
| `apps/web/src/components/ai-chat/tool-results/get-current-date-time-result.tsx` | 新規作成 |
| `apps/web/src/components/ai-chat/tool-results/create-event-result.tsx` | 新規作成 |
| `apps/web/src/components/ai-chat/tool-results/index.tsx` | 新規作成 |

route.ts / DB スキーマ変更不要。

## チェックリスト

- [ ] `tool-results/write-plan-result.tsx` 作成（UI は変えない）
- [ ] `tool-results/get-current-date-time-result.tsx` 作成
- [ ] `tool-results/create-event-result.tsx` 作成
- [ ] `tool-results/index.tsx` にレジストリ定義
- [ ] `chat-widget.tsx` から if ブロックを削除してレジストリ参照に変更
- [ ] `(part as any)` の排除（`ToolInvocationUIPart` 型を使用）
- [ ] TypeScript エラーなし確認
- [ ] 既存ツール結果の表示が変わっていないこと確認
