# Issue #103: fix: 申請確認モーダルの日時表示を ISO 文字列から自然な表現に修正する

## 背景

イベント編集ページの申請確認モーダル（「申請内容の確認」ダイアログ）で、
日時が `2026-02-28T15:00:00.000Z 〜 2026-02-28T16:00:00.000Z` という ISO 8601 形式のまま表示されている。
`2026年2月28日（土）15:00 〜 16:00` のような読みやすい表現に修正する。

**原因箇所**: `event-edit-form.tsx` 124行目

```tsx
<span>{hasDatetime ? `${startAt} 〜 ${endAt}` : t("submit_confirm_not_set")}</span>
```

`startAt` / `endAt` は ISO 文字列の state なので、そのまま文字列展開すると生の ISO が表示される。

## 参照

- GitHub Issue: #103
- 関連ドキュメント: なし
- docs/architecture/decisions.md #2（タイムゾーン設計: UTC 保存 → ブラウザタイムゾーンで表示）
- docs/architecture/decisions.md #8（多言語対応: ロケールに応じたフォーマット）

## 実装方針

- `Intl.DateTimeFormat`（または `toLocaleDateString` / `toLocaleTimeString`）でフォーマットする
- `locale` は既に `Props` で受け取っているのでそのまま使う
- 同日の場合: `2026年2月28日（土）15:00 〜 16:00`（日付は1回、終了は時刻のみ）
- 日をまたぐ場合: `2026年2月28日（土）15:00 〜 3月1日（日）02:00`
- フォーマットロジックはコンポーネント内のヘルパー関数として実装（ファイル分割不要）
- 新規パッケージ不要（Web 標準の `Intl` API で十分）

## 実装ステップ

1. **`event-edit-form.tsx` にフォーマットヘルパー関数を追加**

   コンポーネント関数の外（または内）に以下を定義:

   ```ts
   function formatDatetimeRange(startIso: string, endIso: string, locale: string): string {
     const start = new Date(startIso);
     const end = new Date(endIso);

     const dateOpts: Intl.DateTimeFormatOptions = {
       year: "numeric",
       month: "long",
       day: "numeric",
       weekday: "short",
     };
     const timeOpts: Intl.DateTimeFormatOptions = {
       hour: "2-digit",
       minute: "2-digit",
     };

     const startDateStr = start.toLocaleDateString(locale, dateOpts);
     const startTimeStr = start.toLocaleTimeString(locale, timeOpts);
     const endTimeStr = end.toLocaleTimeString(locale, timeOpts);

     // 同日判定: 年月日が同じか
     const isSameDay =
       start.getFullYear() === end.getFullYear() &&
       start.getMonth() === end.getMonth() &&
       start.getDate() === end.getDate();

     if (isSameDay) {
       return `${startDateStr} ${startTimeStr} 〜 ${endTimeStr}`;
     } else {
       const endDateStr = end.toLocaleDateString(locale, dateOpts);
       return `${startDateStr} ${startTimeStr} 〜 ${endDateStr} ${endTimeStr}`;
     }
   }
   ```

2. **124行目の表示を修正**

   ```tsx
   // Before
   <span>{hasDatetime ? `${startAt} 〜 ${endAt}` : t("submit_confirm_not_set")}</span>

   // After
   <span>
     {hasDatetime
       ? formatDatetimeRange(startAt, endAt, locale)
       : t("submit_confirm_not_set")}
   </span>
   ```

3. **動作確認**（Playwright）

   - イベント編集ページ（`/dashboard/event/[eventId]/edit`）を開く
   - 日時を設定した状態で「申請する」ボタンを押してモーダルを表示
   - 日時が自然な表現で表示されていることを確認

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` のみ

翻訳ファイル変更なし（フォーマット変更のみ）。

## チェックリスト

- [ ] `formatDatetimeRange` ヘルパーを実装した
- [ ] 124行目の日時表示を `formatDatetimeRange` 呼び出しに差し替えた
- [ ] 同日の場合に日付が1回のみ表示される
- [ ] 日をまたぐ場合に両端に日付が表示される
- [ ] `ja` ロケールで `2026年2月28日（土）15:00 〜 16:00` のように表示される
- [ ] Playwright でモーダル表示を確認済み
