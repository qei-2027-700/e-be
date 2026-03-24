---
name: docs-steering
description: GitHub Issue 番号を受け取り、.Codex/steering/ に実装計画ファイルを生成するスキル。Issue 内容と docs/features/ を参照して作成する。
model: sonnet
---

GitHub Issue 番号: $ARGUMENTS

以下の手順で実行計画ファイルを作成してください。

## Step 1: Issue を取得

```bash
gh issue view $ARGUMENTS --json number,title,body,labels,comments
```

上記を実行し、Issue の内容を把握してください。

## Step 2: 関連する docs/features/ を確認

`docs/features/` ディレクトリが存在する場合、ファイル一覧を確認し、
Issue の内容と関連がありそうな `.md` ファイルを読み込んでください。

関連度の判断基準:
- Issue のタイトル・本文に含まれるキーワードとファイル名が一致する
- Issue が扱う機能領域（イベント管理・認証・店舗・FC等）と内容が重なる

## Step 3: 実行計画ファイルを作成

`.Codex/steering/` に以下の命名規則でファイルを作成してください。

**ファイル名**: `issue-{番号}-{kebab-case-タイトル}.md`
例: `issue-12-vitepress-setup.md`

**ファイル内容のフォーマット**:

```md
# Issue #{番号}: {タイトル}

## 背景

{Issue の目的・課題をここに要約}

## 参照

- GitHub Issue: #{番号}
- 関連ドキュメント: {参照した docs/features/*.md のパス（あれば）}

## 実装方針

{設計の意図・選択の理由を簡潔に}

## 実装ステップ

1. {具体的な手順}
2. {具体的な手順}
...

## 影響範囲

- 変更されるファイル・ディレクトリ
- 依存するパッケージや設定

## チェックリスト

- [ ] {完了条件}
- [ ] {完了条件}
```

## 注意事項

- ステップは実装者がそのまま作業できる粒度で書く
- 推測で補った部分は明示する（「Issue に記載なし、要確認」等）
- 既存の `.Codex/steering/` ファイルと重複する内容があれば参照を記載する
- **ファイルを作成する前にユーザーへの確認は不要**。`Write` ツールで直接作成してください

---

**次のステップ**: ステアリングが生成されたら `/implement $ARGUMENTS` で実装を開始してください。
