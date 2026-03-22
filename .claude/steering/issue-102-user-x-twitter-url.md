# Issue #102: feat: ユーザープロフィールとイベントページに X (Twitter) URL を表示する

## 背景

イベント主催者が X (Twitter) の URL をプロフィールに登録し、
- プロフィールページ（`/users/[userId]`）
- イベント詳細ページ（`/dashboard/event/[eventId]`）

で X リンクとして表示できるようにする。

現状：
- `users` テーブルに SNS 関連カラムなし
- 設定画面（`/dashboard/settings`）は退会セクションのみ
- プロフィールページ・イベント詳細ページに主催者の SNS リンクなし

## 参照

- GitHub Issue: #102
- 関連ドキュメント: なし
- docs/architecture/decisions.md #1（ソフトデリート）、#8（i18n）

## 実装方針

- `users` テーブルに `x_url: text('x_url')` を追加（nullable、任意項目）
- バリデーション: `https://x.com/` または `https://twitter.com/` で始まる URL のみ許可（Server Action 内でチェック）
- 表示: 未設定時は非表示、設定時は外部リンク（`target="_blank" rel="noopener noreferrer"`）
- 設定画面に X URL 入力フィールドを追加（現状は退会セクションのみなので汎用の「プロフィール設定」セクションとして追加）
- イベント詳細の `getEventDetail` クエリに主催者 `userId` と `xUrl` を追加して表示

## 実装ステップ

### 1. DB スキーマ変更

`packages/db/src/schema.ts` の `users` テーブルに追加:

```ts
xUrl: text('x_url'),
```

マイグレーション:
```bash
pnpm db:generate
pnpm db:migrate
```

### 2. Server Action の作成

`apps/web/src/lib/actions/user.ts` を新規作成（または auth.ts に追記）:

```ts
'use server'

export async function updateXUrl(formData: FormData): Promise<{ error?: string } | { ok: true }> {
  // 1. 認証チェック（getDbUser()）
  // 2. formData.get('xUrl') を取得
  // 3. バリデーション: 空 OR https://x.com/ OR https://twitter.com/ で始まる
  // 4. db update users set x_url = ? where id = userId
  // 5. 成功 or エラーを返す
}
```

バリデーション例:
```ts
const val = (formData.get('xUrl') as string ?? '').trim();
if (val && !val.startsWith('https://x.com/') && !val.startsWith('https://twitter.com/')) {
  return { error: 'invalid_url' };
}
```

### 3. 設定画面の更新

`apps/web/src/app/[locale]/dashboard/settings/page.tsx`:
- `ProfileSection` コンポーネント（Client Component）を作成して追加
- X URL の入力フィールドと保存ボタン
- 現在の設定値を DB から取得して初期値にセット

`apps/web/src/app/[locale]/dashboard/settings/profile-section.tsx` を新規作成:

```tsx
'use client'
// Input, Button, Label, useTransition, useState
// updateXUrl Server Action 呼び出し
// バリデーションエラー表示
```

### 4. `getEventDetail` クエリの拡張

`apps/web/src/lib/events.ts` の `EventDetail` 型と `getEventDetail` に追加:

```ts
// 型追加
organizerUserId: string;
organizerXUrl: string | null;

// SELECT 追加
organizerUserId: events.userId,
organizerXUrl: users.xUrl,

// FROM に users JOIN 追加
.innerJoin(users, eq(events.userId, users.id))
```

### 5. イベント詳細ページへの表示追加

`apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx`:
- 主催者情報セクションに X リンクを追加
- `event.organizerXUrl` が非 null の場合のみ表示

```tsx
{event.organizerXUrl && (
  <a
    href={event.organizerXUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    X (Twitter)
  </a>
)}
```

### 6. プロフィールページへの表示追加

`apps/web/src/app/[locale]/users/[userId]/page.tsx`:
- DB クエリに `xUrl` を追加（`users.xUrl`）
- `profileUser.xUrl` が非 null の場合のみ X リンクを表示

### 7. i18n 翻訳キーの追加

`apps/web/messages/ja.json` と `en.json` に追加:

```json
// dashboard.account_settings 以下
"x_url_label": "X (Twitter) URL",
"x_url_placeholder": "https://x.com/username",
"x_url_save": "保存",
"x_url_saved": "X URL を保存しました",
"x_url_error_invalid": "https://x.com/ または https://twitter.com/ で始まる URL を入力してください",
"x_url_error_unknown": "保存に失敗しました"
```

## 影響範囲

- `packages/db/src/schema.ts` — `users` テーブルに `xUrl` 追加
- `packages/db/` — マイグレーションファイル
- `apps/web/src/lib/actions/user.ts` — 新規作成（X URL 更新 Action）
- `apps/web/src/app/[locale]/dashboard/settings/page.tsx` — ProfileSection 追加
- `apps/web/src/app/[locale]/dashboard/settings/profile-section.tsx` — 新規作成
- `apps/web/src/lib/events.ts` — `EventDetail` 型と `getEventDetail` クエリ拡張
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` — X リンク表示
- `apps/web/src/app/[locale]/users/[userId]/page.tsx` — X リンク表示
- `apps/web/messages/ja.json` / `en.json` — 翻訳キー追加

## チェックリスト

- [ ] `users` テーブルに `x_url` カラム追加・マイグレーション適用
- [ ] `updateXUrl` Server Action が動作する（バリデーション含む）
- [ ] 設定画面から X URL を保存できる
- [ ] 不正 URL（https://x.com/ 以外）でエラーが表示される
- [ ] 空欄で保存すると X URL がクリアされる
- [ ] プロフィールページに X リンクが表示される（設定時のみ）
- [ ] イベント詳細ページに主催者の X リンクが表示される（設定時のみ）
- [ ] 未設定時は X リンクが非表示
- [ ] 外部リンクが `target="_blank" rel="noopener noreferrer"` で開く
- [ ] i18n 翻訳キーが ja / en 両方に追加済み
- [ ] Playwright で動作確認済み
