# VitePress ドキュメントサイト — GitHub Pages 公開

## 完了条件

- `main` push → GitHub Actions → `https://<USER>.github.io/e-be/` で公開される
- `pnpm dev` でローカル確認できる（http://localhost:5173）

---

## 1. セットアップ

```bash
cd /Users/km/dev/_github/e-be/docs
pnpm add -D vitepress
```

**`docs/package.json`**

```json
{
  "name": "@e-be/docs",
  "private": true,
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "preview": "vitepress preview"
  },
  "devDependencies": {
    "vitepress": "latest"
  }
}
```

**`pnpm-workspace.yaml` に追加**

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "docs"          # ← 追加
```

---

## 2. VitePress 設定

**`docs/.vitepress/config.ts`**

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'イーベ (E-be)',
  description: '店舗と主催者をつなぐイベントバー運営プラットフォーム',
  base: '/e-be/',   // リポジトリ名に合わせる
  lang: 'ja',
  themeConfig: {
    nav: [
      { text: 'はじめに', link: '/getting-started' },
      { text: 'アーキテクチャ', link: '/architecture/overview' },
    ],
    sidebar: [
      {
        text: 'ガイド',
        items: [{ text: 'はじめに', link: '/getting-started' }],
      },
      {
        text: 'アーキテクチャ',
        items: [
          { text: '全体設計', link: '/architecture/overview' },
          { text: 'データベース', link: '/architecture/database' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/<YOUR_USERNAME>/e-be' },
    ],
  },
})
```

---

## 3. 初期コンテンツ

**`docs/index.md`**（トップページ）

```md
---
layout: home
hero:
  name: "イーベ"
  text: "E-be"
  tagline: 「良いイベント」を増やす。店舗と主催者をつなぐイベントバー運営プラットフォーム。
  actions:
    - theme: brand
      text: はじめに
      link: /getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/<YOUR_USERNAME>/e-be
features:
  - icon: 🎪
    title: イベント管理
    details: 開催リクエスト・承認・時間重複チェックを一元管理
  - icon: 🏪
    title: マルチテナント
    details: 1事業者 = N店舗の階層構造で運営をシンプルに
  - icon: 🤖
    title: AI分析基盤
    details: 実績データをAI分析用テキストとしてエクスポート
---
```

**`docs/getting-started.md`** — セットアップ手順
**`docs/architecture/overview.md`** — モノレポ構成・技術スタック
**`docs/architecture/database.md`** — 主要エンティティ説明

---

## 4. GitHub Actions

**`.github/workflows/docs.yml`**

```yaml
name: Deploy Docs to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.github/workflows/docs.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @e-be/docs build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

**GitHub Pages 有効化**: リポジトリ Settings → Pages → Source: `GitHub Actions`

---

## 5. .gitignore に追記

```
docs/.vitepress/dist
docs/.vitepress/cache
```

---

## チェックリスト

- [ ] `pnpm --filter @e-be/docs dev` でローカル表示確認
- [ ] `pnpm --filter @e-be/docs build` でビルド成功
- [ ] `.github/workflows/docs.yml` を push
- [ ] GitHub Pages を `GitHub Actions` ソースで有効化
- [ ] `https://<USER>.github.io/e-be/` で表示確認
