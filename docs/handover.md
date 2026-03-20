# E-be システム引き渡しガイド

このドキュメントは、E-be（イーベ）システムをイベントバー運営事業者へ引き渡す際の手順書です。
アカウント移管・環境設定・運用継続に必要な情報をまとめています。

---

## 目次

1. [システム概要](#1-システム概要)
2. [引き渡し対象アカウント一覧](#2-引き渡し対象アカウント一覧)
3. [GitHub リポジトリ引き渡し](#3-github-リポジトリ引き渡し)
4. [Supabase 引き渡し](#4-supabase-引き渡し)
5. [GCP（Google Cloud）引き渡し](#5-gcpgoogle-cloud-引き渡し)
6. [ホスティング・デプロイ設定](#6-ホスティングデプロイ設定)
7. [環境変数チェックリスト](#7-環境変数チェックリスト)
8. [引き渡し後の確認事項](#8-引き渡し後の確認事項)

---

## 1. システム概要

| 項目 | 内容 |
|------|------|
| サービス名 | E-be（イーベ） |
| 概要 | イベントバー向けイベント管理・集客プラットフォーム |
| Web アプリ | Next.js 16 (React 19) |
| モバイルアプリ | Expo |
| データベース | Supabase（PostgreSQL） |
| 認証 | Supabase Auth（Google OAuth 連携） |
| ストレージ | Supabase Storage |
| 多言語 | 日本語・英語（next-intl） |

### リポジトリ構成

```
e-be/
├── apps/
│   ├── web/        # Next.js 16 Web アプリ
│   └── mobile/     # Expo モバイルアプリ
├── packages/
│   └── db/         # Drizzle ORM スキーマ（Web/Mobile 共有）
└── docs/           # 設計・仕様ドキュメント
```

---

## 2. 引き渡し対象アカウント一覧

引き渡しの際に必ず確認・移管するアカウントです。

| サービス | 用途 | 移管方法 |
|---------|------|---------|
| GitHub | ソースコード管理 | Organization の Owner 権限を移譲 |
| Supabase | DB・認証・ストレージ | Organization Owner を移譲 |
| Google Cloud Platform | Google OAuth 認証 | プロジェクト Owner を移譲 |
| ホスティング（Vercel 等） | Web アプリ公開 | チームメンバーとして追加・移譲 |

> ⚠️ **注意**: 各サービスのメールアドレスを変更する場合は、Supabase の認証設定との整合性を先に確認してください。

---

## 3. GitHub リポジトリ引き渡し

### 個人リポジトリ → 新オーナーへ移管する場合

1. GitHub → リポジトリ → **Settings → General**
2. 最下部の **Danger Zone** → **Transfer ownership**
3. 新オーナーの GitHub ユーザー名を入力して移管

### Organization リポジトリの場合

1. Organization の **Settings → Members**
2. 新担当者を **Owner** ロールで招待
3. 元担当者を **Member** に降格（または退会）

### 移管後の作業

- [ ] CI/CD（GitHub Actions）のシークレットを新環境用に更新
- [ ] デプロイ先（Vercel 等）の GitHub 連携を再認可

---

## 4. Supabase 引き渡し

### 4-1. Organization Owner の移譲

1. [supabase.com/dashboard](https://supabase.com/dashboard) にログイン
2. 左上の Organization セレクター → **Settings**
3. **Members** タブ → 新担当者を **Owner** として招待
4. 招待メールを承認してもらう
5. 元担当者の権限を **Member** に変更（または退会）

### 4-2. プロジェクトへのアクセス確認

移管後、新オーナーが以下にアクセスできることを確認します。

| 確認先 | 内容 |
|-------|------|
| **Table Editor** | データの読み書きができるか |
| **Authentication → Users** | ユーザー一覧が見えるか |
| **Storage → Buckets** | ストレージバケットが見えるか |
| **Settings → API** | `anon key` / `service_role key` が取得できるか |
| **Settings → Database** | DB 接続文字列が取得できるか |

### 4-3. API キーの更新

移管後はセキュリティのため API キーをローテーションします。

1. Supabase Dashboard → **Settings → API**
2. **JWT Secret** の **Rotate** ボタンを押す
3. ローテーション後、アプリの環境変数を新しい値に更新して再デプロイ

> ⚠️ JWT Secret をローテーションすると、既存の全セッションが無効になります（ユーザーの再ログインが必要）。メンテナンス時間を設けて実施してください。

### 4-4. 接続情報（引き渡し時にメモすること）

```
Supabase URL:      https://[プロジェクトID].supabase.co
Anon Key:          [Settings → API → anon public]
Service Role Key:  [Settings → API → service_role] ← 厳重管理
DB 接続文字列:     [Settings → Database → Connection string]
```

### 4-5. Row Level Security（RLS）の確認

本システムは RLS を有効にしてデータを保護しています。
スキーマ変更をする際は、必ず RLS ポリシーも一緒に確認してください。
詳細: `packages/db/` 内の Drizzle スキーマファイルを参照。

---

## 5. GCP（Google Cloud）引き渡し

E-be では Google OAuth（ソーシャルログイン）のために GCP プロジェクトを使用しています。

### 5-1. プロジェクト Owner の追加

1. [console.cloud.google.com](https://console.cloud.google.com) を開く
2. プロジェクト選択（`e-be`）
3. **IAM と管理 → IAM**
4. **アクセスを許可** → 新担当者のメールアドレスを入力
5. ロールを **オーナー（Owner）** に設定 → **保存**
6. 元担当者のロールを削除

### 5-2. OAuth クレデンシャルの確認

1. **APIs & Services → 認証情報**
2. **OAuth 2.0 クライアント ID** の一覧を確認
3. `e-be web` のクレデンシャルが存在することを確認

### 5-3. OAuth 同意画面の更新

移管後は OAuth 同意画面の連絡先情報を更新します。

1. **APIs & Services → OAuth 同意画面**
2. **アプリ情報** の「ユーザーサポートメール」を新担当者のメールに変更
3. **デベロッパーの連絡先情報** も更新
4. **保存して次へ**

### 5-4. 本番公開前の審査（未実施の場合）

テストユーザー制限（100人）を解除するには Google の審査が必要です。

1. OAuth 同意画面 → **Publishing status** を確認
2. `Testing` の場合 → **アプリを公開** をクリックして審査申請
3. 審査には通常 1〜2 週間かかります
4. 審査通過後、100人制限が解除されます

> 詳細手順: [`docs/setup/google-oauth.md`](./setup/google-oauth.md)

### 5-5. 引き渡し時に変更が不要なもの

Client ID を変更すると既存ユーザーの OAuth 連携が切れるため、以下は**変更しないこと**を推奨します。

- OAuth 2.0 Client ID / Client Secret（Supabase に設定済みのもの）
- Authorized redirect URIs

どうしてもメールアドレスを変えたい場合は、既存ユーザーへ事前告知の上、再ログインを促してください。

---

## 6. ホスティング・デプロイ設定

### Web アプリのデプロイ

本システムは Vercel（または同等のプラットフォーム）へのデプロイを想定しています。

#### Vercel の場合

1. [vercel.com](https://vercel.com) → チームの **Settings → Members**
2. 新担当者を **Owner** として招待
3. GitHub 連携が有効なことを確認（自動デプロイが動くか）

#### 環境変数の引き継ぎ

Vercel Dashboard → プロジェクト → **Settings → Environment Variables** に設定されている値を新環境にコピーします。
（次章のチェックリストを参照）

### ローカル開発環境の構築

新担当者がローカルで開発できるようにするための手順です。

```bash
# 前提: Node.js 20.9.0 以上、pnpm 9.7.1 以上

git clone <リポジトリURL>
cd e-be

# 依存関係インストール
pnpm install

# 環境変数ファイルを作成（後述のチェックリストを参照）
cp apps/web/.env.example apps/web/.env.local  # ファイルがあれば

# 開発サーバー起動
pnpm dev
```

---

## 7. 環境変数チェックリスト

以下の環境変数を新担当者に引き渡します。値は別途セキュアな方法（パスワードマネージャー等）で共有してください。

### Web アプリ（`apps/web/.env.local`）

| 変数名 | 取得元 | 説明 |
|--------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | 公開用 anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | サーバー専用キー（厳重管理）|
| `DATABASE_URL` | Supabase → Settings → Database | PostgreSQL 接続文字列 |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスできるため、クライアント側コードに含めないこと。

---

## 8. 引き渡し後の確認事項

引き渡し完了後、以下を新担当者と一緒に確認します。

### 動作確認

- [ ] Web アプリが正常に表示される
- [ ] Google でのログイン・ログアウトが動作する
- [ ] ユーザー登録フローが正常に動作する
- [ ] Supabase Dashboard でデータが確認できる
- [ ] ストレージへのファイルアップロードが動作する

### セキュリティ確認

- [ ] 元担当者の Supabase アクセスを削除
- [ ] 元担当者の GCP アクセスを削除
- [ ] 元担当者の GitHub アクセスを削除
- [ ] 元担当者の Vercel アクセスを削除
- [ ] 必要に応じて Supabase の JWT Secret をローテーション

### ドキュメント確認

新担当者が開発・運用を継続するために参照すべきドキュメントです。

| ドキュメント | 内容 |
|------------|------|
| [`docs/README.md`](./README.md) | 機能一覧・全体像 |
| [`docs/architecture/decisions.md`](./architecture/decisions.md) | 設計の意思決定記録 |
| [`docs/features/`](./features/) | 機能別ビジネスルール |
| [`docs/setup/google-oauth.md`](./setup/google-oauth.md) | Google OAuth の詳細設定 |
| [`CLAUDE.md`](../CLAUDE.md) | AI 駆動開発ワークフロー（Claude Code 利用時） |

---

## お問い合わせ先（引き渡し元）

引き渡し後に不明点が生じた場合の連絡先を記載してください。

| 項目 | 内容 |
|------|------|
| 担当者名 | （記入） |
| メールアドレス | （記入） |
| 対応期間 | （記入） |
