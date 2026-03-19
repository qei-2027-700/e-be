# #01 GitHub リポジトリ作成・初回 push

## 概要

ローカルで構築済みのモノレポを GitHub に公開する。
GitHub Pages を使うためにリポジトリが必須。

## 手順

```bash
# 1. リモートリポジトリ作成（公開 or 非公開を選択）
gh repo create e-be --public \
  --description "イーベ - イベントバー運営・分析プラットフォーム"

# 2. リモートを登録
git remote add origin git@github.com:<YOUR_USERNAME>/e-be.git

# 3. .gitignore 確認（node_modules, .next, .env*.local が含まれているか）

# 4. 初回コミット・push
git add .
git commit -m "chore: initial monorepo setup (Next.js + VitePress docs)"
git push -u origin main
```

## 確認事項

- [ ] `gh repo view` でリポジトリが確認できる
- [ ] GitHub 上でファイル一覧が表示される
- [ ] `.env*.local` が push されていないこと

## メモ

- GitHub Pages を使う場合、**Public リポジトリ**なら無料で使える
- Private の場合は GitHub Pro / Team プランが必要
