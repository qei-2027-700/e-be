# Issue #158: 通知機能の実装

## 背景

通知ページ・`sendNotification()` は実装済み。以下2点が未実装。
1. Bell アイコンに未読バッジが表示されない
2. `submitEvent()` 実行時に店舗 owner への `EVENT_PENDING` 通知が発火しない

## 参照

- GitHub Issue: #158
- 通知ページ: `apps/web/src/app/[locale]/dashboard/notifications/page.tsx`
- ヘッダー: `apps/web/src/components/layout/app-header.tsx`
- ハンバーガー: `apps/web/src/components/layout/hamburger-menu.tsx`
- layout: `apps/web/src/app/[locale]/dashboard/layout.tsx`
- event actions: `apps/web/src/lib/actions/event.ts`

## 実装ステップ

### 1. 未読数バッジ

**dashboard/layout.tsx**
- `notifications` テーブルから `userId = dbUser.id AND readAt IS NULL AND deletedAt IS NULL` の件数を取得
- `unreadCount` を `AppHeader` と `HamburgerMenu` に props として渡す

**app-header.tsx**
- `unreadCount: number` を props に追加
- Bell アイコンを `relative` ラップし、`unreadCount > 0` のとき赤いバッジ（最大99+）を表示

```tsx
<Link href={...} className="... relative">
  <Bell className="h-4 w-4" />
  {unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</Link>
```

**hamburger-menu.tsx**
- `unreadCount: number` を props に追加（`"use client"` なので prop として受け取る）
- 通知リンクの Bell アイコンに同様のバッジを追加

### 2. EVENT_PENDING 通知

**event.ts の submitEvent()**
- select に `title: events.title` を追加
- status 更新後、`organizationMembers` から `orgId = target.orgId AND role = 'owner' AND deletedAt IS NULL` の userId を取得
- `getLocale()` / `getTranslations()` で通知テキストを i18n 化
- 各 owner に `sendNotification()` 呼び出し

### 3. 翻訳キー追加

**ja.json / en.json** の `notifications` セクションに追加:
```json
"eventPending": {
  "title": "新しいイベント申請: {eventTitle}",
  "titleNoName": "新しいイベント申請が届きました",
  "body": "イベンターから開催申請が届きました。内容を確認してください。"
}
```

英語:
```json
"eventPending": {
  "title": "New event application: {eventTitle}",
  "titleNoName": "New event application received",
  "body": "An eventer has submitted an event application. Please review the details."
}
```

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/layout.tsx`
- `apps/web/src/components/layout/app-header.tsx`
- `apps/web/src/components/layout/hamburger-menu.tsx`
- `apps/web/src/lib/actions/event.ts`
- `apps/web/messages/ja.json` / `en.json`

## チェックリスト

- [ ] 未読通知がある場合、Bell に赤バッジ・件数が表示される
- [ ] ハンバーガーメニューの通知リンクにもバッジが表示される
- [ ] イベント申請（submitEvent）時にバー owner へ通知が送られる
- [ ] 通知テキストが i18n キーから生成される
- [ ] `pnpm typecheck` で新規エラーなし
