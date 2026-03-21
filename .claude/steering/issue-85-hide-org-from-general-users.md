# Issue #85: 「所属組織」表示を一般ユーザーにはデフォルト非表示にする

## 背景

ダッシュボードのプロフィール画面や公開プロフィールページで「所属組織」情報が表示されているが、
一般ユーザー（イベント参加者）には不要な情報であるため、デフォルトで非表示にしたい。

## 参照

- GitHub Issue: #85
- 関連ドキュメント: なし（コード調査済み）

## 影響箇所の整理

コード調査で特定した「所属組織」が表示される箇所:

| 場所 | ファイル | 内容 | 対応方針 |
|------|---------|------|---------|
| ① ダッシュボード「所属組織」カード | `dashboard/page.tsx` L302〜 | `t("orgs_title")` = "所属組織" カード | 一般ユーザーかつ org なしの場合は非表示 |
| ② 公開プロフィール 主催履歴の orgName | `users/[userId]/page.tsx` L50 | 各イベント行に `event.orgName` を表示 | 完全に非表示（削除） |
| ③ イベント詳細の「開催店舗」| `dashboard/event/[eventId]/page.tsx` L89,144 | "venue" として orgName を表示 | **変更しない**（これは店舗情報＝UI上の意味が異なる） |
| ④ 管理者画面 | `admin/applications/page.tsx` | orgName 表示 | **変更しない**（管理者用） |

## 実装方針

### ① ダッシュボード「所属組織」カード非表示

- `userType === "user"` かつ `userOrgs.length === 0` の場合、「所属組織」カードごと非表示にする
- `userOrgs.length > 0` の場合は userType に関係なく表示する（venue_user が org を持つケースと同様）
- 「所属している組織はありません」+ 申請リンクの表示は不要なので削除

### ② 公開プロフィールの orgName 非表示

- `/users/[userId]/page.tsx` の各イベント行から `event.orgName` の表示を削除
- `getPublicOrganizerHistory` / `PublicOrganizerHistoryItem` の `orgName` フィールドも不要になるので除去

## 実装ステップ

1. **`apps/web/src/lib/events.ts` 修正**
   - `PublicOrganizerHistoryItem` 型から `orgName` フィールドを削除
   - `getPublicOrganizerHistory` 関数の SELECT 句から `orgName: organizations.name` を削除
   - `innerJoin(organizations, ...)` は JOIN が不要になるので削除し、`from(events)` だけにする

2. **`apps/web/src/app/[locale]/users/[userId]/page.tsx` 修正**
   - `<p className="text-xs text-muted-foreground">{event.orgName}</p>` の行を削除

3. **`apps/web/src/app/[locale]/dashboard/page.tsx` 修正**
   - 「所属組織」カード（`orgs_title` 〜 `</Card>`）をレンダリングする条件を追加
   - `userOrgs.length > 0` の場合のみカードを表示する
   - （`userOrgs.length === 0` の empty state ブロック + apply ボタンは削除対象）

## 影響範囲

- **変更するファイル**
  - `apps/web/src/lib/events.ts`
  - `apps/web/src/app/[locale]/users/[userId]/page.tsx`
  - `apps/web/src/app/[locale]/dashboard/page.tsx`
- **変更しないファイル**
  - i18n（新しいキーを追加しない）
  - DB スキーマ（変更なし）
  - 管理者画面（変更なし）

## チェックリスト

- [ ] 一般ユーザー（userType=user）でダッシュボードを表示 → 「所属組織」カードが表示されない
- [ ] venue_user または org に所属しているユーザーでダッシュボードを表示 → 「所属組織」カードが表示される
- [ ] 公開プロフィールページ（`/users/[userId]`）で orgName が表示されない
- [ ] 管理者画面・イベント詳細の「開催店舗」は変更なし
- [ ] TypeScript エラーなし
