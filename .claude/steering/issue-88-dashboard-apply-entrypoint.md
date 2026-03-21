# Issue #88: ダッシュボードから事業者申請ページへのエントリポイントを追加する

## 背景

PR #87 で「所属組織」カードの empty state（`userOrgs.length === 0` 時の表示）を削除したことで、
一般ユーザー（`userType === "user"`）が事業者申請ページ（`/dashboard/apply`）にアクセスするための
ナビゲーションがなくなった。`/dashboard/apply` ページ自体は残っているが、導線がない状態。

## 参照

- GitHub Issue: #88
- 関連ドキュメント: `docs/features/store-creation.md`
- 申請ページ: `apps/web/src/app/[locale]/dashboard/apply/page.tsx`
- ダッシュボード: `apps/web/src/app/[locale]/dashboard/page.tsx`
- 翻訳: `apps/web/messages/ja.json`, `apps/web/messages/en.json`（`dashboard.apply_operator`、`dashboard.application_pending` が既存）

## 実装方針

ダッシュボードの右カラム（`userType === "user"` 向けエリア）の末尾に「事業者申請」カードを追加する。

- 申請済み（pending）の場合 → 「審査中」バッジを表示（リンクなし）
- 未申請の場合 → 「事業者として申請する」ボタンを表示

申請中かどうかの判定には `operatorApplications` テーブルを照会する。
ダッシュボード page.tsx で並行取得（`Promise.all`）する。

## 実装ステップ

1. `apps/web/src/app/[locale]/dashboard/page.tsx` を修正
   - `userType === "user"` の場合の並行取得に `getPendingApplication(user.id)` を追加
   - `getPendingApplication` は `@/lib/events` または `@/lib/auth` に追加（後述）

2. `apps/web/src/lib/auth.ts`（または適切なライブラリファイル）に `getPendingApplication` を追加
   ```ts
   export async function getPendingApplication(userId: string) {
     const rows = await db
       .select({ id: operatorApplications.id })
       .from(operatorApplications)
       .where(
         and(
           eq(operatorApplications.userId, userId),
           eq(operatorApplications.status, "pending"),
           isNull(operatorApplications.deletedAt)
         )
       )
       .limit(1);
     return rows.length > 0;
   }
   ```

3. ダッシュボードの右カラム末尾に申請カードを追加
   ```tsx
   {userType === "user" && (
     <Card>
       <CardHeader>
         <CardTitle>{t("apply_operator_title")}</CardTitle>
       </CardHeader>
       <CardContent>
         {hasPendingApplication ? (
           <div className="flex items-center gap-2 py-2">
             <Badge variant="secondary">{t("application_pending")}</Badge>
             <p className="text-sm text-muted-foreground">{t("application_pending_description")}</p>
           </div>
         ) : (
           <Link
             href={`/${locale}/dashboard/apply`}
             className="inline-flex min-h-11 items-center rounded-lg border border-border bg-background px-4 text-[0.8rem] font-medium transition-all hover:bg-muted"
           >
             {t("apply_operator")}
           </Link>
         )}
       </CardContent>
     </Card>
   )}
   ```

4. 翻訳キーを追加
   - `dashboard.apply_operator_title`: 「事業者申請」 / "Venue Operator Application"
   - `dashboard.application_pending_description`: 「申請内容を審査中です。審査が完了次第ご連絡します。」 / "Your application is under review. We will contact you once the review is complete."

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/page.tsx`
- `apps/web/src/lib/auth.ts`（新関数追加）
- `apps/web/messages/ja.json`（翻訳キー追加）
- `apps/web/messages/en.json`（翻訳キー追加）

## チェックリスト

- [ ] `getPendingApplication` 関数を追加
- [ ] ダッシュボードで pending 状態を取得
- [ ] `userType === "user"` 向けに申請カードを表示
- [ ] 未申請時: 「事業者として申請する」リンクを表示
- [ ] 申請中時: 「審査中」バッジと説明文を表示
- [ ] 翻訳キー（ja/en）を追加
- [ ] Playwright で動作確認
