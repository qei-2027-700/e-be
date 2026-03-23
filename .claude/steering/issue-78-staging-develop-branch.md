# Issue #78: staging環境の構築 — `develop`ブランチ + Vercel Preview

## 背景

現状は `main` へのマージが即 Vercel 本番デプロイになっている。
`develop` ブランチを挟み、staging で動作確認してから `main` へマージするフローを確立する。

## 参照

- GitHub Issue: #78
- 既存ワークフロー: `.github/workflows/ci.yml`, `.github/workflows/docs.yml`
- 本番 URL: https://e-be-web.vercel.app

## 実装方針

**シンプルさ優先**: Vercel は `main` 以外のブランチを自動で Preview デプロイする機能を持つ。
追加インフラ不要で `develop` ブランチを作るだけで staging URL が得られる。

- `develop` ブランチを作成（`main` から分岐）
- Vercel の Preview デプロイが `develop` push で自動発火（設定不要）
- CI ワークフローを `develop` ブランチにも適用
- ブランチ保護ルールを GitHub で設定（TBD: リポジトリ設定のため手動作業）
- `docs.yml` のトリガーは `main` のみのまま維持

## 開発フロー（変更後）

```
feature/xxx → develop（PR） → staging確認 → main（PR） → 本番
```

## 実装ステップ

1. `develop` ブランチを `main` から作成・push
2. `ci.yml` のトリガーに `develop` ブランチを追加
3. `DEVELOPMENT.md` にブランチ戦略を記載

## TBD（手動作業が必要なもの）

- **Vercel staging URL の確認**: Vercel ダッシュボードで `develop` ブランチの Preview URL を確認する
- **ブランチ保護ルール**: GitHub リポジトリ設定で `main` / `develop` に保護ルールを設定する
  - `main`: PR必須、CI通過必須
  - `develop`: PR必須

## チェックリスト

- [ ] `develop` ブランチ作成・push
- [ ] `ci.yml` に `develop` ブランチ追加
- [ ] `DEVELOPMENT.md` 作成（ブランチ戦略の説明）

## 影響範囲

- `.github/workflows/ci.yml`（修正）
- `DEVELOPMENT.md`（新規）
- `develop` ブランチ（新規作成）
