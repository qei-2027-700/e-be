# Issue #56: 複数ページで getLocale() / getTranslations() / getUser() を Promise.all で並列化

## 背景

以下の2ページで、相互に依存しない非同期処理（`params`, `getLocale()`, `getTranslations()`, `getUser()`）が
直列 await されており、各処理が順番に実行されている。`Promise.all()` で並列化すると数十〜百 ms 削減できる。

Issue #54 で `getUser()` 自体のリモートHTTP往復は解消済み。本 Issue はさらに上位の並列化最適化。

## 参照

- GitHub Issue: #56
- 関連ドキュメント: なし（ページの非同期初期化の最適化）
- 前提: Issue #54 がマージ済みであること（main にマージ済み ✅）

## 実装方針

`Promise.all()` で独立した非同期処理をまとめて並列実行する。
`getOrgRole(user.id, orgId)` は `user.id` に依存するため、`getUser()` の後に直列実行する（変更しない）。

## 実装ステップ

### 1. `dashboard/event/[eventId]/page.tsx`

**変更前**:
```ts
const { eventId } = await params;
const locale = await getLocale();
const t = await getTranslations("event_detail");
const user = await getUser();
if (!user) notFound();
```

**変更後**:
```ts
const [{ eventId }, locale, t, user] = await Promise.all([
  params,
  getLocale(),
  getTranslations("event_detail"),
  getUser(),
]);
if (!user) notFound();
```

### 2. `dashboard/org/[orgId]/settings/page.tsx`

**変更前**:
```ts
const { orgId } = await params;
const locale = await getLocale();
const t = await getTranslations("dashboard");
const user = await getUser();
if (!user) { redirect(...) }
const role = await getOrgRole(user.id, orgId);
```

**変更後**:
```ts
const [{ orgId }, locale, t, user] = await Promise.all([
  params,
  getLocale(),
  getTranslations("dashboard"),
  getUser(),
]);
if (!user) { redirect(`/${locale}/auth/sign-in`); }
const role = await getOrgRole(user.id, orgId);  // ← user.id に依存するため直列のまま
```

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` — 冒頭の await を並列化
- `apps/web/src/app/[locale]/dashboard/org/[orgId]/settings/page.tsx` — 冒頭の await を並列化（getOrgRole は直列維持）

## チェックリスト

- [ ] `dashboard/event/[eventId]/page.tsx` の直列 await を `Promise.all` に変更
- [ ] `dashboard/org/[orgId]/settings/page.tsx` の直列 await を `Promise.all` に変更
- [ ] ローカルで開発サーバーを起動し、イベント詳細ページが正常表示されることを確認
- [ ] 組織設定ページが正常表示されることを確認（owner アカウントで確認）
- [ ] TypeScript エラーがないことを確認
