# Issue #176: AIチャット onFinish DB書き込みを after() でラップ

## 背景

`POST /api/chat` の `streamText` に渡している `onFinish` コールバック内で、
トークン累計の upsert と `chatMessages` への AI レスポンス保存を行っている。

Vercel Functions はストリーミングレスポンスを送信完了した時点で関数インスタンスが終了することがある。
`onFinish` は `streamText` 内部から非同期で呼ばれるが、レスポンス送信後にインスタンスが落ちると
DB 書き込みが中断されて会話履歴が欠損する可能性がある。

`next/server` の `after()` でラップすることで、レスポンス完了後も処理継続が保証される。

## 参照

- GitHub Issue: #176
- 対象ファイル: `apps/web/src/app/api/chat/route.ts`
- 関連 PR: #175（履歴永続化実装）

## 実装方針

`onFinish` の中身を `after()` でラップするだけ。ロジックの変更は一切不要。

```ts
import { after } from "next/server";

onFinish: async ({ response, usage }) => {
  after(async () => {
    const totalTokens = usage?.totalTokens ?? 0;
    // ... 既存の DB 書き込み処理をそのまま移動 ...
  });
},
```

## 実装ステップ

1. `apps/web/src/app/api/chat/route.ts` を開く
2. `import { after } from "next/server"` を追加
3. `onFinish` コールバック内の全処理を `after(async () => { ... })` でラップ
4. `onFinish` 自体は async のままでよい（`after()` の呼び出しだけして即 return）
5. `pnpm typecheck` でエラーがないことを確認

## 注意事項

- `after()` は Next.js 15以降で利用可能（このプロジェクトは Next.js 15+）
- `after()` に渡す async 関数はエラーが起きてもストリームには影響しない
- `onFinish` の引数（`response`, `usage`）は `after()` クロージャの外でキャプチャされるため、
  クロージャ内から参照しても問題ない
- 未認証ユーザー用の `streamText`（`onFinish` なし）は変更不要

## 影響範囲

- `apps/web/src/app/api/chat/route.ts` のみ（1ファイル、最小変更）

## チェックリスト

- [ ] `import { after } from "next/server"` が追加されている
- [ ] `onFinish` 内の全 DB 書き込み処理が `after()` でラップされている
- [ ] `pnpm typecheck` がエラーなし
- [ ] ローカルでチャットを送信し、会話履歴が正しく保存されることを確認
