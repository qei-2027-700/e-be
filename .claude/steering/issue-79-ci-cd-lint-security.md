# Issue #79: CI/CD改善 — lint・typecheck・脆弱性診断の組み込み

## 背景

現在 `.github/workflows/` には `docs.yml` のみ存在し、Webアプリのlint・typecheck・セキュリティチェックが自動化されていない。
PRマージ前に品質ゲートを設けることで、コード品質と安全性を担保する。

## 参照

- GitHub Issue: #79
- 既存ワークフロー: `.github/workflows/docs.yml`
- ルートスクリプト: `package.json` — `lint`, `typecheck`
- Webアプリ: `apps/web/package.json` — `eslint`, `typescript`

## 実装方針

- **シンプルさ優先**: 1ファイル（`ci.yml`）にまとめる
- `pnpm audit` で脆弱性診断（high以上でfail）
- `turbo lint` + `turbo typecheck` でコード品質チェック
- PRと`main`へのpushでトリガー
- `apps/web/**` または `packages/**` の変更時のみ実行（docs変更では不要）

## 実装ステップ

1. `.github/workflows/ci.yml` を新規作成
   - トリガー: `push` (main) / `pull_request`
   - paths filter: `apps/**`, `packages/**`, `pnpm-lock.yaml`
   - jobs:
     1. `lint-typecheck`: `pnpm install` → `turbo lint` → `turbo typecheck`
     2. `audit`: `pnpm audit --audit-level=high`

## チェックリスト

- [ ] `.github/workflows/ci.yml` 作成
- [ ] lint job が通ること（ローカルで `pnpm lint` 確認）
- [ ] typecheck job が通ること（ローカルで `pnpm typecheck` 確認）
- [ ] audit job が通ること

## 影響範囲

- `.github/workflows/ci.yml`（新規）
