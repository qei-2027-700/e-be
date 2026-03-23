# /implement <issue番号>

指定した Issue のステアリングを読み、実装から PR マージまでを以下の skill を順番に呼び出して完了させる。

## 実行順序

```
③ /docs-steering $ARGUMENTS   — ステアリング生成（未作成の場合のみ）
④ ブランチ作成                   — feat/issue-$ARGUMENTS-{kebab-case}
⑤ 実装                          — ステアリングのチェックリストに沿って実装
⑥ /pw-verify                    — Playwright スクリーンショット＋動作確認
⑦ commit + push
⑧ /gh-pr                        — PR 作成
⑨ /gh-rv                        — 2段階セルフレビュー
   └ LGTM → merge
   └ 要修正 → 修正 → /gh-rv 再実行
```

## 手順

### Step 0: 引数の確認

`$ARGUMENTS` が空の場合は実装を開始せず、まず Issue 一覧を表示してユーザーに番号を確認してください。

```bash
gh issue list --repo qei-2027-700/e-be --state open
```

「どの Issue を実装しますか？番号を指定してください。」と聞いてから次へ進む。

### Step 1: ステアリングの確認・生成

`.claude/steering/issue-$ARGUMENTS-*.md` を探してください。

```bash
ls .claude/steering/issue-$ARGUMENTS-*.md 2>/dev/null
```

- 存在する → そのまま読んで次へ
- 存在しない → `/docs-steering $ARGUMENTS` を実行してステアリングファイルを生成し、**生成完了後すぐに Step 2 以降の実装フローを続行する**（ユーザーへの確認や再実行の案内は不要）

### Step 2: 関連ドキュメントを読む

ステアリングの「参照」セクションに記載されたファイルをすべて読んでください:
- `docs/features/*.md`（該当するもの）
- `docs/architecture/decisions.md`（関連セクション）
- `.claude/rules/`（実装対象のパスに該当するルール）

### Step 3: Worktree 作成

`/worktree-setup $ARGUMENTS` を実行する。

- worktree ディレクトリ: `../wt-$ARGUMENTS`
- dev サーバーのポートは `/tmp/wt-$ARGUMENTS-port.txt` に保存される

以降の実装・コミット・push はすべて `../wt-$ARGUMENTS` 内で行う。

### Step 4: 実装

ステアリングの「実装ステップ」と「チェックリスト」に沿って実装する。

- TBD に遭遇したら**実装を止めてユーザーに確認する**
- 翻訳キーは `ja.json` と `en.json` の両方に追加する
- `.claude/rules/` のルールを守る（i18n・mobile-first・coding-conventions 等）

### Step 5: /pw-verify

Playwright MCP でスクリーンショットを取得して動作確認する。
問題があれば修正してから次へ進む。

> **worktree dev サーバーのポートを確認してから検証すること:**
> ```bash
> DEV_PORT=$(cat /tmp/wt-$ARGUMENTS-port.txt 2>/dev/null || echo 3000)
> echo "検証 URL: http://localhost:$DEV_PORT"
> ```
> Playwright では必ず worktree のポート（3001〜など）を使う。メインリポジトリの 3000 番は使わない。

### Step 6: commit + push

`/gh-ship` を実行する。

### Step 7: /gh-pr

PR を作成する（`--repo qei-2027-700/e-be`）。

### Step 8: /gh-rv

2段階セルフレビューを実施する。

- **要修正** → 修正コミットを追加し、`/gh-rv` を再実行する
- **LGTM** → マージしてクリーンアップ

```bash
# PR マージ（リモートブランチも同時削除）
gh pr merge --merge --delete-branch --repo qei-2027-700/e-be {PR番号}
```

マージコマンドが **成功した場合のみ**、以下のクリーンアップを実行する。
失敗（CI 未通過・コンフリクト等）した場合はクリーンアップを行わず、原因を調査して修正すること。

```bash
# マージ成功後のみ実行 ↓

# worktree dev サーバーを停止
DEV_PID=$(cat /tmp/wt-$ARGUMENTS-pid.txt 2>/dev/null)
[ -n "$DEV_PID" ] && kill $DEV_PID 2>/dev/null
rm -f /tmp/wt-$ARGUMENTS-pid.txt /tmp/wt-$ARGUMENTS-port.txt /tmp/wt-$ARGUMENTS-dev.log

cd {元のリポジトリルート（e-be/）}
git worktree remove ../wt-$ARGUMENTS
git branch -d feat/issue-$ARGUMENTS-{ブランチ名}
git pull origin main
```

### Step 9: 次の Issue への継続提案（最大 3 回ループ）

#### 9-1: 実行回数をカウントアップ

```bash
COUNTER_FILE="/tmp/e-be-implement-count.txt"
COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
COUNT=$((COUNT + 1))
echo $COUNT > "$COUNTER_FILE"
echo "今セッション $COUNT 回目の implement が完了"
```

#### 9-2: 上限チェックと次の提案

**COUNT が 3 以上** の場合:
```
セッション上限（3 Issue）に達しました。
新しいセッションを開始するか、/ctx-export で引き継ぎ文書を生成してください。
```
→ ここで終了。次の提案は行わない。

**COUNT が 3 未満** の場合:
残りのオープン Issue を取得して提案する。

```bash
gh issue list --repo qei-2027-700/e-be --state open --limit 10
```

ステアリングが既にある Issue を優先して、次の 1 件を提案する:

```bash
ls .claude/steering/issue-*.md 2>/dev/null | sed 's/.*issue-//' | sed 's/-.*//'
```

出力例:
```
── 次の実装候補（残り {3 - COUNT} 回）──────────────────
  #XX  {Issue タイトル} ← ステアリング済み（推奨）
  #YY  {Issue タイトル}
  #ZZ  {Issue タイトル}
─────────────────────────────────────────────────────────
次の Issue を実装しますか？番号を指定するか、「いいえ」と答えてください。
```

ユーザーが番号を指定した場合 → そのまま `/implement <番号>` を実行する（Step 0 に戻る）。
「いいえ」または無応答の場合 → 終了。

## 注意

- スクリーンショットはコミット対象外（`.playwright-mcp/` は .gitignore 済み）
- 1セッションで着手する Issue は最大 3 つまで（Step 9 のカウンターで管理）
- カウンターファイル `/tmp/e-be-implement-count.txt` はセッション開始時にリセットされる（`/tmp` は再起動で消える）
- commit + push は `/gh-ship` → `/gh-pr` → `/gh-rv` → merge の順で進める
