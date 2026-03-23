---
model: haiku
---

# worktree-setup

Issue 番号: $ARGUMENTS

指定した Issue 番号の git worktree を作成し、dev サーバーが起動できる状態まで整えてください。

## Step 1: ブランチ名の決定

ステアリングファイルのタイトルから kebab-case のブランチ名を決める。

```
BRANCH=feat/issue-$ARGUMENTS-{ステアリングのタイトルをkebab-caseに変換}
WORKTREE=../wt-$ARGUMENTS
```

## Step 2: Worktree 作成 + 依存インストール

```bash
git worktree add ../wt-$ARGUMENTS -b $BRANCH
cd ../wt-$ARGUMENTS
pnpm i
```

## Step 3: .env.local をコピー

メインリポジトリの `.env.local` を worktree にコピーする（なければスキップ）。

```bash
[ -f ../e-be/apps/web/.env.local ] && \
  cp ../e-be/apps/web/.env.local ../wt-$ARGUMENTS/apps/web/.env.local
```

## Step 4: 内部パッケージをビルド

`@e-be/db` が未ビルドだと dev サーバーが 500 エラーになる。

```bash
cd ../wt-$ARGUMENTS
pnpm --filter @e-be/db build
```

## Step 5: 空きポートで dev サーバーを起動

```bash
DEV_PORT=$(for p in 3001 3002 3003 3004 3005; do
  lsof -i :$p 2>/dev/null | grep -q LISTEN || { echo $p; break; }
done)

cd ../wt-$ARGUMENTS/apps/web
PORT=$DEV_PORT pnpm dev > /tmp/wt-$ARGUMENTS-dev.log 2>&1 &
DEV_PID=$!

# ポートと PID を保存（pw-verify・cleanup で参照）
echo $DEV_PORT > /tmp/wt-$ARGUMENTS-port.txt
echo $DEV_PID  > /tmp/wt-$ARGUMENTS-pid.txt

echo "worktree dev server: http://localhost:$DEV_PORT (PID $DEV_PID)"
```

## Step 6: 起動完了を確認（最大 30 秒待機）

```bash
for i in $(seq 1 30); do
  curl -s -o /dev/null -w "%{http_code}" http://localhost:$DEV_PORT/ja 2>/dev/null \
    | grep -q "^[23]" && echo "✅ ready" && break
  sleep 1
done
```

起動に失敗した場合はログを確認する:

```bash
tail -20 /tmp/wt-$ARGUMENTS-dev.log
```

---

セットアップ完了後は `../wt-$ARGUMENTS` ディレクトリ内で実装・コミット・push を行う。
