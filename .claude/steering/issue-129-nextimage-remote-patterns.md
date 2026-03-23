# Issue #129: chore: next/image の remotePatterns 設定 — thumbnailUrl 対応

## 背景

`apps/web/next.config.ts` に `remotePatterns` が未設定のため、`thumbnailUrl` に外部 URL が保存された際に `next/image` がランタイムエラーになる。現在は全イベントの `thumbnail_url` が null のため問題ないが、thumbnailUrl 管理 UI 実装前に対応する。

## 参照

- GitHub Issue: #129

## 実装方針

- Supabase Storage のドメイン `*.supabase.co` を `remotePatterns` で許可する
- Issue 本文の提案通りに実装（プロトコル: https）

## 実装ステップ

1. `apps/web/next.config.ts` に `images.remotePatterns` を追加

```ts
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.supabase.co' },
  ],
},
```

## 影響範囲

- `apps/web/next.config.ts` のみ

## チェックリスト

- [ ] `next.config.ts` に `images.remotePatterns` が追加されている
- [ ] `*.supabase.co` が許可されている
