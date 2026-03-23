---
name: harness-lint
description: .claude/ 配下のハーネス構成（skills・commands・rules・steering）を静的チェックするスキル。フロントマターの欠落・重複・不正値を検出して報告する。
model: haiku
---

`.claude/` 配下のファイルを検査し、問題点を一覧で報告してください。

## チェック対象と観点

### 1. `.claude/skills/*/SKILL.md` — スキルファイル

各 SKILL.md に対して以下を確認する:

| フィールド | 必須 | 有効値 |
|-----------|------|--------|
| `name` | ✅ | ディレクトリ名と一致しているか |
| `description` | ✅ | 空でないか・200文字以内か |
| `model` | 推奨 | `haiku` / `sonnet` / `opus` のいずれか |

追加チェック:
- `name` がスキル一覧内で重複していないか
- フロントマター区切り `---` が正しく開閉されているか（開始・終了の両方が存在するか）

### 2. `.claude/rules/*.md` — ルールファイル

各ルールファイルに対して以下を確認する:

| フィールド | 必須 | 備考 |
|-----------|------|------|
| `description` | ✅ | 空でないか |
| `paths` | ✅ | 1件以上のグロブパターンが設定されているか |

追加チェック:
- `paths` の値がリスト形式（`- "..."` 形式）になっているか
- フロントマター区切り `---` が正しく開閉されているか

### 3. `.claude/commands/*.md` — コマンドファイル

- フロントマターがある場合、`---` が正しく開閉されているか
- ファイルが空でないか

### 4. `.claude/steering/issue-*.md` — ステアリングファイル

- `issue-{番号}-` のファイル名形式になっているか（番号が数値か）
- ファイルが空でないか

## 実行手順

```bash
# 対象ファイルを列挙
find .claude/skills -name "SKILL.md"
find .claude/rules -name "*.md"
find .claude/commands -name "*.md"
find .claude/steering -name "issue-*.md"
```

各ファイルを読み込み、上記の観点でチェックしてください。

## 出力フォーマット

問題がある場合:

```
❌ .claude/skills/xxx/SKILL.md
   - name が未設定
   - model の値 "gpt-4" は無効（haiku / sonnet / opus のいずれかにしてください）

❌ .claude/rules/yyy.md
   - paths が未設定

⚠️  .claude/skills/zzz/SKILL.md
   - description が 200 文字を超えています（現在: 230 文字）
```

問題がない場合:

```
✅ すべてのハーネスファイルが正常です（skills: N, rules: N, commands: N, steering: N）
```

エラー（❌）と警告（⚠️）を分けて報告し、最後にサマリーを出力してください。
