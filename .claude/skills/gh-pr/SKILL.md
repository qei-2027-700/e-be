---
name: gh-pr
description: 現在のブランチの Pull Request を GitHub に作成するスキル。コミット・diff を確認し、適切なタイトルと本文で PR を起票する。
model: sonnet
---

現在のブランチの PR を作成してください。

対象リポジトリ: https://github.com/qei-2027-700/e-be

## Step 1: 現在の状態を確認

```bash
git branch --show-current
git log main..HEAD --oneline
git diff main --stat
```

コミット済みで未プッシュの場合はプッシュしてから PR を作成します。

## Step 2: プッシュ（未プッシュの場合）

```bash
git push -u origin {ブランチ名}
```

## Step 3: PR 作成

関連 Issue 番号をブランチ名（`feat/issue-{番号}-*`）から推測してください。

```bash
gh pr create \
  --repo qei-2027-700/e-be \
  --title "{Issue タイトルに合わせたタイトル}" \
  --body "$(cat <<'EOF'
## 概要
{実装した内容を 1〜3 行で}

## 変更内容
- {箇条書き}

## 関連 Issue
Closes #{番号}

## 確認方法
- [ ] {検証手順}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

## Step 4: PR URL を表示

作成した PR の URL を出力してください。

---

**次のステップ**: `/gh-rv` で PR のセルフレビューを行ってください。
