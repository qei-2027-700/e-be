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
- 存在しない → `/docs-steering $ARGUMENTS` を実行してから次へ

### Step 2: 関連ドキュメントを読む

ステアリングの「参照」セクションに記載されたファイルをすべて読んでください:
- `docs/features/*.md`（該当するもの）
- `docs/architecture/decisions.md`（関連セクション）
- `.claude/rules/`（実装対象のパスに該当するルール）

### Step 3: ブランチ作成

```bash
git checkout -b feat/issue-$ARGUMENTS-{ステアリングのタイトルをkebab-caseに変換}
```

### Step 4: 実装

ステアリングの「実装ステップ」と「チェックリスト」に沿って実装する。

- TBD に遭遇したら**実装を止めてユーザーに確認する**
- 翻訳キーは `ja.json` と `en.json` の両方に追加する
- `.claude/rules/` のルールを守る（i18n・mobile-first・coding-conventions 等）

### Step 5: /pw-verify

Playwright MCP でスクリーンショットを取得して動作確認する。
問題があれば修正してから次へ進む。

### Step 6: commit + push

```bash
git add {実装したファイルを個別に指定}
git commit -m "feat: {実装内容の説明}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push -u origin {ブランチ名}
```

### Step 7: /gh-pr

PR を作成する（`--repo qei-2027-700/e-be`）。

### Step 8: /gh-rv

2段階セルフレビューを実施する。

- **要修正** → 修正コミットを追加し、`/gh-rv` を再実行する
- **LGTM** → マージして完了

```bash
gh pr merge --merge --delete-branch --repo qei-2027-700/e-be {PR番号}
```

## 注意

- スクリーンショットはコミット対象外（`.playwright-mcp/` は .gitignore 済み）
- 1セッションで着手する Issue は最大 3 つまで
- `gh-ship` は使わず、`gh-pr` → `gh-rv` → merge の順で進める
