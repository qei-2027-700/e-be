Issue 起票: $ARGUMENTS

## 制約

**1回の指示で起票する Issue は最大 3 つまで。** 優先度の高いものから絞ってください。

## Step 1: 既存 Issue の確認（重複防止）

```bash
gh issue list --state open
```

## Step 2: Issue を起票

ユーザーから実装内容が指定されている場合はそのまま起票してください。
指定がない場合は `/survey` の結果を参考に候補を提示し、確認を取ってから起票してください。

各 Issue に含める情報:
- **概要**: 何を実装するか
- **ビジネスルール**: 制約・条件・エッジケース
- **実装対象**: 変更するファイル・機能の範囲
- **参照**: 関連する `docs/architecture/decisions.md` のセクション番号

body の先頭には必ず以下のヘッダーを追加してください:

```
> 🤖 Claude Code `/gh-issue` で起票
```

```bash
gh issue create \
  --label "ai-created,ai:gh-issue" \
  --title "..." \
  --body "$(cat <<'EOF'
> 🤖 Claude Code `/gh-issue` で起票

## 概要
...

## ビジネスルール
...

## 実装対象
- [ ] ...

## 参照
- docs/architecture/decisions.md #{番号}
EOF
)"
```

## Step 3: 起票結果を表示

起票した Issue の番号・タイトル・URL を一覧で出力してください。

---

**次のステップ**: 各 Issue に対して `/docs-steering <issue番号>` を実行してステアリングを生成してください。
