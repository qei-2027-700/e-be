# Issue #63: feat: ダッシュボードのPC向け2カラムレイアウト対応

## 背景

現在のダッシュボードは縦1カラムで全カードが積み重なっており、PCで下までスクロールする機会が多くUXが良くない。`lg:`（1024px）以上で2カラムグリッドに切り替えてスクロール量を削減する。

## 参照

- GitHub Issue: #63
- 関連ドキュメント: なし（UIレイアウト変更のみ）

## 実装方針

Tailwind の `lg:grid` + `lg:grid-cols-[3fr_2fr]` を使い、1024px以上で2カラム化する。SP は既存の `space-y-6` を維持。カード内コンテンツの変更は不要で、JSXの構造（カードの配置順）のみを変更する。

## 実装ステップ

1. `dashboard/page.tsx` の外側コンテナを `max-w-3xl` → `max-w-5xl` に変更
2. タイトル行（`<div className="flex items-center gap-2">` ）は全幅のまま維持
3. カード群をラップする構造を以下のように変更:
   ```jsx
   {/* SP: space-y-6 / PC: 2カラムグリッド */}
   <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
     {/* 左カラム */}
     <div className="space-y-6">
       {/* カレンダー */}
       {userType === "user" && /* 主催履歴 */}
       {userType === "user" && /* 参加履歴 */}
     </div>
     {/* 右カラム */}
     <div className="space-y-6">
       {userType === "user" && /* イベント作成ボタン */}
       {userType === "user" && /* マイイベント */}
       {userType === "user" && /* 参加予定 */}
       {/* 所属組織 (venue_user にも表示) */}
     </div>
   </div>
   ```
4. `app-header.tsx` の `max-w-3xl` → `max-w-5xl` に変更
5. `app-footer.tsx` の `max-w-3xl` → `max-w-5xl` に変更

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/page.tsx`
- `apps/web/src/components/layout/app-header.tsx`
- `apps/web/src/components/layout/app-footer.tsx`

## チェックリスト

- [ ] SP（< 1024px）で1カラム表示が維持されている
- [ ] PC（≥ 1024px）で左右2カラム表示になっている
- [ ] `userType === "user"` で左: カレンダー・主催履歴・参加履歴 / 右: 作成ボタン・マイイベント・参加予定・所属組織
- [ ] `userType === "venue_user"` で左: カレンダー / 右: 所属組織
- [ ] ヘッダー・フッターの幅が `max-w-5xl` に揃っている
