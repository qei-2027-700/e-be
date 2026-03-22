# Issue #90: feat: イベント編集フォームに会場セレクトボックスを追加

## 背景

イベント編集フォームの「会場（バー）」フィールドが現在は読み取り専用テキストとして表示されている。
`draft` 状態のイベントでは、イベンターが会場を変更できるようにすべきである。
また、テスト用シードに1件しかバーデータがないため、セレクトボックスの動作確認ができない。

## 参照

- GitHub Issue: #90
- 関連ドキュメント: `docs/features/event-creation.md`
- 関連ドキュメント: `docs/architecture/decisions.md`（ステートマシン）

## 実装方針

- `getPublicBars()` は既存関数（`apps/web/src/lib/events.ts:50`）を流用する
- セレクトボックスはshadcn/uiの `Select` コンポーネントを使用する
- `updateEventDraft` の `formData` に `orgId` を追加し、DB更新に含める
- `draft` 状態のみ編集可（`page.tsx` で既にステータスチェック済み）
- `pending` 以降は読み取り専用テキスト表示（現行動作を維持）
- フォームに `bars` prop を追加して `page.tsx` から渡す

## 実装ステップ

1. **`apps/web/src/lib/actions/event.ts`**: `updateEventDraft` に `orgId` の読み取り・バリデーション・DB更新を追加
   - `formData.get('orgId')` を取得
   - UUID形式チェック（空文字列は `null` として扱う）
   - `.set({ ..., orgId: orgId ?? undefined })` に追加（`undefined` の場合は変更しない）

2. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/page.tsx`**: `getPublicBars()` を呼び出してフォームに渡す
   - `import { getPublicBars } from "@/lib/events"` を追加
   - `Promise.all` に `getPublicBars()` を追加
   - `EventEditForm` に `bars` prop として渡す

3. **`apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`**: 会場セレクトボックスに変更
   - `Props` に `bars: { id: string; name: string }[]` を追加
   - `EventData` に `status: string` を追加（draft判定に使用）
   - shadcn/ui の `Select` コンポーネントをインポート
   - `orgId` ステートを追加（`useState(event.orgId)`）
   - 会場フィールドを `draft` 状態のみセレクトボックスに、それ以外は読み取り専用テキストに
   - フォーム送信時に `formData.set('orgId', orgId)` を追加
   - `hasVenue` の判定を `Boolean(orgId)` に変更

4. **`apps/web/scripts/seed-test-accounts.mjs`**: テスト用バーを2件以上に増やす
   - 2件目のバーを追加（例: `test-bar-2` / `テストバー2`）
   - 既存の upsert パターンに倣って冪等に実装する

5. **`apps/web/messages/ja.json` / `en.json`**: 必要に応じてラベルを追加
   - `event_edit.venue_select_placeholder` などを確認・追加

## 影響範囲

- `apps/web/src/lib/actions/event.ts`
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/page.tsx`
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`
- `apps/web/scripts/seed-test-accounts.mjs`
- `apps/web/messages/ja.json` / `en.json`

## チェックリスト

- [ ] `updateEventDraft` で `orgId` が保存される
- [ ] `draft` 状態の編集フォームで会場セレクトボックスが表示される
- [ ] セレクトボックスの選択肢に公開バー一覧が表示される（2件以上）
- [ ] 会場を変更して保存後、新しい `orgId` がDBに反映される
- [ ] `pending` 以降のイベントで会場が読み取り専用テキストで表示される
- [ ] バーが未選択の場合、申請・公開ボタンが disabled になる
- [ ] シードスクリプト `pnpm seed:test` で2件以上のバーが作成される
- [ ] `ja.json` / `en.json` の翻訳キーが揃っている
