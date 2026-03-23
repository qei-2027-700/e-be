---
name: survey
description: プロジェクトの現状を把握して次に着手すべき内容を整理するスキル。docs/features・steering・スキーマ・実装状況・open Issue を確認してサマリーを出力する。
model: haiku
---

プロジェクトの現状を把握して、次に着手すべき内容を整理してください。

## Step 1: docs/features/ の確認

`docs/features/` のファイル一覧を表示してください。

## Step 2: .claude/steering/ の確認

`.claude/steering/` のファイル一覧を表示してください。
`issue-{番号}-` で始まるファイルが「ステアリング済み Issue」です。

## Step 3: スキーマの現状確認

`packages/db/src/schema.ts` を読み、定義済みテーブルを把握してください。

## Step 4: 実装状況の確認

以下を確認してください:
- `apps/web/src/app/` のルート構成（ページ一覧）
- `apps/web/src/components/` のコンポーネント一覧
- 直近のコミット: `git log --oneline -10`

## Step 5: サマリーを出力

以下の形式でまとめてください:

```
## 現状サマリー

### ステアリング済み（実装計画あり）
- Issue #{番号}: {タイトル} → steering: {ファイル名}

### docs/features/ にあるがステアリング未作成
- {ファイル名}

### 直近の変更（git log）
- {コミット}
```

---

**次のステップ**: 実装したい内容が決まったら `/gh-issue` で Issue を起票してください（1回の指示で **最大 3 issue** まで）。
