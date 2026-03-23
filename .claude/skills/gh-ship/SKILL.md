---
model: haiku
---

現在のブランチの変更をコミット・プッシュしてください。

## Step 1: 変更内容の確認

```bash
git status
git diff --stat main
```

## Step 2: コミット

変更ファイルを確認してから関連ファイルを add し、コミットしてください。

```bash
git add {関連ファイルを個別に指定}
git commit -m "$(cat <<'EOF'
{コミットメッセージ}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

コミットメッセージの形式:
- `feat: {機能の説明}` — 新機能
- `fix: {修正内容}` — バグ修正
- `chore: {内容}` — 設定・ドキュメント等

## Step 3: プッシュ

```bash
git push -u origin {ブランチ名}
```

---

**次のステップ**: `/gh-pr` で PR を作成してください。
