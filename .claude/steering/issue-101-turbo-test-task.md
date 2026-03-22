# Issue #101: chore: turbo.json に test タスクを追加してモノレポ横断テストを可能にする

## 背景

PR #100 で vitest を `apps/web` に導入したが、`turbo.json` の `tasks` に `test` が定義されていないため、
`turbo test` でモノレポ全体のテストを一括実行できない状態になっている。
`cd apps/web && pnpm test` でしか実行できず、CI でのモノレポ横断テスト実行が不便。

## 参照

- GitHub Issue: #101
- 関連ドキュメント: なし（ビルドツール設定のみ）

## 実装方針

`turbo.json` の `tasks` に `test` タスクを追加するだけ。
`cache: false` とするのはテスト結果をキャッシュすると古い結果が返ることがあるため。
Issue に記載の通り最小限の設定のみ追加する。

## 実装ステップ

1. `turbo.json` を開き、`tasks` オブジェクトに以下を追加する:
   ```json
   "test": {
     "cache": false
   }
   ```
2. `pnpm turbo test` または `turbo test` でモノレポ全体のテストが実行されることを確認する

## 影響範囲

- 変更ファイル: `turbo.json`（1ファイルのみ）
- 依存パッケージ・設定への影響なし

## チェックリスト

- [ ] `turbo.json` の `tasks` に `"test": { "cache": false }` が追加されている
- [ ] `pnpm turbo test` を実行して `apps/web` のテストが通ること
