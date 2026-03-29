# Issue #202: fix: getDailyTokens クエリに日付フィルタを追加して composite index を活用する

## 背景

PR #200 で `aiChatDailyUsage` テーブルに composite unique index `(userId, date)` を追加したが、
`getDailyTokens` 関数のクエリはユーザーIDのみで絞り込んでいた。
`row.date !== today` の後続チェックで正しく動作しているが、インデックスを活用できていない。

## 参照

- GitHub Issue: #202
- 関連 PR: #200（composite index 追加）

## 実装方針

`getDailyTokens` の WHERE 句に `date = today` を追加することで composite index を活用する。
`row.date !== today` の後続チェックは不要になるため削除。

## 実装ステップ

1. `apps/web/src/app/api/chat/route.ts` の drizzle-orm import に `and` を追加
2. `getDailyTokens` の `.where()` を `and(eq(userId), eq(date, today))` に変更
3. `.limit(1)` は削除（composite unique key なのでレコードは最大1件）
4. `if (!row || row.date !== today)` の日付チェックを `if (!row)` に簡略化

## 影響範囲

- `apps/web/src/app/api/chat/route.ts`（getDailyTokens 関数のみ）

## チェックリスト

- [ ] `and` が drizzle-orm からインポートされている
- [ ] クエリが `(userId, date)` の両方で絞り込んでいる
- [ ] 日付の重複チェック `row.date !== today` が削除されている
