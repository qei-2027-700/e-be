# Issue #149 — mise で Node/pnpm バージョンを固定する

## 目的

`.mise.toml` を追加し、ローカル・CI 両方で Node/pnpm バージョンを強制する。

## 実装ステップ

1. `.mise.toml` をリポジトリルートに作成
   - node = "20.9.0"
   - pnpm = "9.7.1"

2. `.github/workflows/ci.yml` を更新
   - `pnpm/action-setup` と `actions/setup-node` を `jdx/mise-action` に置き換え

3. `README.md` のセットアップ手順に `mise install` を追記

## チェックリスト

- [ ] `.mise.toml` 作成
- [ ] `ci.yml` 更新（mise-action 使用）
- [ ] `README.md` 更新

## 参考

- mise 公式: https://mise.jdx.dev/
- mise-action: https://github.com/jdx/mise-action
