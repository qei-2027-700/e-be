# Google OAuth セットアップ

Supabase Auth で Google サインインを有効化する手順。

## 前提知識

- Google OAuth 自体は**完全無料・認証回数無制限**
- OAuth consent screen を「External」で作成した場合、Google 審査前は**テストユーザー最大100人**のみログイン可能
- 一般公開時は Google に審査申請が必要（無料・審査期間1〜2週間）
- **開発中はテスト制限のまま進めて、リリース前に審査申請**すれば問題なし

## 後から変更できること

| 変更内容 | 可否 | 方法 |
|---------|------|------|
| Client ID / Secret の更新 | ✅ | Supabase Dashboard で上書き |
| Google Cloud プロジェクトの乗り換え | ✅ | 新しいクレデンシャルを Supabase に貼り直すだけ |
| 別の Google アカウントに移管 | ✅ | Google Cloud Console でオーナー権限を移譲 |
| Callback URL の変更 | ✅ | Google Console の Authorized redirect URIs を更新 |

> ⚠️ **注意**: Client ID を変えると既存ユーザーの OAuth 連携が切れる（再ログインが必要）。本番稼働後の乗り換えはユーザー影響があるため、開発中に決めるのがベスト。

## セットアップ手順

### 1. Supabase で Callback URL を確認

1. Supabase Dashboard → **Authentication → Providers → Google**
2. **Enable** をオンにする
3. 表示された **Callback URL** をコピーしておく（例: `https://xxxx.supabase.co/auth/v1/callback`）

### 2. Google Cloud Console で OAuth クレデンシャルを作成

1. [console.cloud.google.com](https://console.cloud.google.com) を開く
2. プロジェクト選択 → **新規プロジェクト作成**（プロジェクト名: `e-be`）
3. `APIs & Services` → **OAuth consent screen**
   - User Type: **External**
   - App name・サポートメール等を入力して保存
4. `APIs & Services` → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: `e-be web`
   - **Authorized redirect URIs** に手順1でコピーした Callback URL を追加
5. **作成** → **Client ID** と **Client Secret** をコピー

### 3. Supabase に入力

1. Supabase Dashboard → **Authentication → Providers → Google** に戻る
2. `Client ID (for OAuth)` → 手順2の Client ID を貼り付け
3. `Client Secret (for OAuth)` → 手順2の Client Secret を貼り付け
4. **Save** をクリック

### 4. テストユーザーの追加（審査前）

Google Cloud Console → **OAuth consent screen** → **Test users** → メールアドレスを追加

追加したメールアドレスのみ、審査前でも Google サインインが使える。

## 本番公開前にやること

- [ ] OAuth consent screen の情報を正式なものに更新（ロゴ・プライバシーポリシー URL・利用規約 URL）
- [ ] Google に審査申請（Publishing status を "In production" に変更）
- [ ] 審査完了後、100人制限が解除される
