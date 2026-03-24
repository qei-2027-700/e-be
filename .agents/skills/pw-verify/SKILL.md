---
name: pw-verify
description: Playwright MCP を使って実装した機能を動作確認するスキル。dev サーバーに接続してスクリーンショットを取得し、表示・動作を検証する。
model: haiku
---

Playwright MCP で実装した機能を動作確認してください。

## Step 1: 検証対象の dev サーバーを確認

**worktree での実装の場合、メインリポジトリの dev サーバー（port 3000）ではなく、worktree 専用のポートを使う。**

```bash
# implement コマンドが保存したポートを確認
ISSUE_NUM=$(git branch --show-current | grep -oE 'issue-[0-9]+' | grep -oE '[0-9]+')
DEV_PORT=$(cat /tmp/wt-${ISSUE_NUM}-port.txt 2>/dev/null || echo "")

if [ -n "$DEV_PORT" ]; then
  # 起動済みか確認
  curl -s -o /dev/null -w "%{http_code}" http://localhost:$DEV_PORT/ja 2>/dev/null | grep -qE "^[23]" \
    && echo "✅ worktree dev server running: http://localhost:$DEV_PORT" \
    || echo "⚠️  worktree dev server (port $DEV_PORT) is not responding"
else
  # worktree 外 or ポートファイルなし → port 3000 を確認
  DEV_PORT=3000
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ja 2>/dev/null | grep -qE "^[23]" \
    && echo "✅ dev server running: http://localhost:3000" \
    || echo "⚠️  no dev server found"
fi
echo "検証 URL のベース: http://localhost:$DEV_PORT"
```

worktree の dev サーバーが起動していない場合は再起動する:

```bash
WORKTREE_DIR=$(git worktree list | grep "wt-${ISSUE_NUM}" | awk '{print $1}')
if [ -n "$WORKTREE_DIR" ]; then
  NEW_PORT=$(for p in 3001 3002 3003 3004 3005; do
    lsof -i :$p 2>/dev/null | grep -q LISTEN || { echo $p; break; }
  done)
  cd "$WORKTREE_DIR/apps/web" && PORT=$NEW_PORT pnpm dev > /tmp/wt-${ISSUE_NUM}-dev.log 2>&1 &
  echo $NEW_PORT > /tmp/wt-${ISSUE_NUM}-port.txt
  echo "再起動: http://localhost:$NEW_PORT"
  sleep 10
  DEV_PORT=$NEW_PORT
fi
```

## Step 2: 現在のブランチ・変更内容を確認

```bash
git branch --show-current
git diff main --name-only
```

変更されたファイルから「どの画面・機能を検証すべきか」を判断してください。

## Step 3: Playwright MCP で動作確認

実装した機能に関連するページを順番に確認してください:

1. **対象ページを開く** — 実装した機能のページへナビゲート
2. **正常系を確認** — 期待通りに表示・動作するか
3. **エラー系を確認** — バリデーションエラー・権限エラー等が正しく表示されるか
4. **スクリーンショットを取得** — 各状態のスクリーンショットを撮影

スクリーンショットの保存先: `.playwright-mcp/` （.gitignore 済み）

## Step 4: 確認結果を報告

以下の形式で報告してください:

```
## 検証結果

### ✅ 正常確認
- {ページ/機能}: {確認した内容}

### ❌ 問題あり（要修正）
- {ページ/機能}: {問題の内容}
```

問題がある場合はその場で修正し、修正後に再度 Playwright で確認してください。

---

**次のステップ**: 検証が完了したら `/gh-ship` でコミット・PR 作成・マージを実行してください。
