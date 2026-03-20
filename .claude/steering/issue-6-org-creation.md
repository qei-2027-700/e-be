# Issue #6: 事業者申請フロー — ユーザーが事業者として申請できるようにする

## 背景

当初「ダッシュボードから組織を直接作成」と想定していたが、設計の見直しにより、組織作成は**管理者のみ**が行える。一般ユーザーは「事業者申請」フォームから申し込み、管理者の承認を経て組織が作成される。

Issue #6 のスコープをこの申請フロー全体に変更する。

## 参照

- GitHub Issue: #6
- `docs/features/store-creation.md`
- `docs/architecture/decisions.md` #11（ユーザー種別とロール設計）
- `docs/architecture/decisions.md` #14（事業者申請フロー）
- `.claude/steering/auth-role-control.md`（実装済みのユーティリティ）

## 実装方針

- **申請フォーム** を `/[locale]/dashboard/apply` に配置（Server Action で処理）
- `operator_applications` テーブルに申請情報を保存
- 管理者画面（`/admin`）から申請一覧を確認・承認・却下できる
- 承認時はトランザクションで `organizations` + `organization_members` + `users.userType` を更新
- ダッシュボードの「組織を作成」ボタンを「事業者として申請する」リンクに変更
  - `userType = 'user'` かつ申請中でない場合のみ表示
  - 申請中の場合は「審査中」バッジを表示

## 実装ステップ

### フェーズ1: DB スキーマ更新

1. `users` テーブルに `userType: 'user' | 'venue_user' | 'system_user'` を追加（default: 'user'）
2. `operator_applications` テーブルを追加
3. Drizzle マイグレーション実行

### フェーズ2: auth ユーティリティ追加

4. `apps/web/src/lib/auth.ts` に `getUserType(userId)` / `isAdmin(userId)` を追加

### フェーズ3: 申請フォーム（ユーザー向け）

5. 翻訳キー追加（`messages/ja.json` / `messages/en.json`）
6. 申請ページ `apps/web/src/app/[locale]/dashboard/apply/page.tsx` を作成
   - `userType = 'venue_user'` または既に申請中なら `/dashboard` へリダイレクト
   - フォーム: 店舗名・スラッグ・説明・住所
7. Server Action で `operator_applications` に insert
8. ダッシュボード（`apps/web/src/app/[locale]/dashboard/page.tsx`）を更新
   - `userType` に応じて表示を出し分け
   - `user` + 未申請 → 「事業者として申請する」リンク
   - `user` + 申請中 → 「審査中」バッジ
   - `venue_user` → 所属組織一覧

### フェーズ4: 管理者画面（admin 向け）

9. 管理者ガード: `apps/web/src/app/[locale]/admin/` に `userType = 'system_user'` チェックを追加
10. 申請一覧ページ `apps/web/src/app/[locale]/admin/applications/page.tsx`
11. 承認・却下の Server Action（トランザクション処理）

## 影響範囲

- `packages/db/src/schema.ts` — `userTypeEnum` 追加、`users.userType`、`operator_applications` テーブル追加
- `apps/web/src/lib/auth.ts` — `getUserType()` / `isAdmin()` 追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — userType に応じた表示切り替え
- `apps/web/src/app/[locale]/dashboard/apply/` — 新規
- `apps/web/src/app/[locale]/admin/` — 新規（管理者画面）
- `messages/ja.json` / `messages/en.json` — 翻訳キー追加

## チェックリスト

- [ ] `users.userType` カラムが追加され、既存ユーザーのデフォルトが `'user'`
- [ ] `operator_applications` テーブルが作成される
- [ ] 申請フォームから送信できる
- [ ] スラッグのバリデーションが効く（英数字・ハイフンのみ）
- [ ] スラッグ重複時にエラーが表示される
- [ ] ダッシュボードで申請中ユーザーに「審査中」バッジが表示される
- [ ] 管理者画面で申請一覧が見える
- [ ] 承認するとトランザクションで組織・メンバー・userType が更新される
- [ ] 却下すると申請 status が `rejected` になる
- [ ] `userType = 'user'` のユーザーは管理者画面にアクセスできない

## TBD

- 複数店舗の申請（Premium 機能との兼ね合い）
- 申請却下後の再申請ルール（即時可 or 一定期間後）
- 管理者への通知手段（メール・Slack 等）
- 承認後の申請者への通知
