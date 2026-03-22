# Issue #86: 主催イベント履歴-売上金額などの列を追加

## 背景

主催イベント履歴（ダッシュボード）の一覧に、現在表示されていない以下の情報を追加する：

- **参加者数**（`event_participations` の `registered` ステータス件数）
- **チャージ料**（`events.chargeAmount`）
- **売上金額**（`chargeAmount × 参加者数`）

イベンターが主催した各イベントの実績（収益・集客数）を一目で確認できるようにするのが目的。

Issue 本文は空欄のため、表示項目の選定は上記仕様で推測している。
TBD: 売上金額の定義（キャンセル分を差し引くか等）→ 現状は `registered` 件数×チャージ料を "売上" とみなす。

## 参照

- GitHub Issue: #86
- 関連ドキュメント: `docs/features/organizer-history.md`
- 既存ステアリング: `.claude/steering/issue-15-organizer-event-history.md`
- コンポーネント: `apps/web/src/app/[locale]/dashboard/organizer-history-item.tsx`
- クエリ: `apps/web/src/lib/events.ts` → `getOrganizerHistory`
- スキーマ: `packages/db/src/schema.ts`（`events.chargeAmount`、`eventParticipations`）

## 実装方針

- `getOrganizerHistory` のクエリに参加者数の subquery を追加する
  - `count(eventParticipations.id)` where `status = 'registered'` の相関サブクエリ or LEFT JOIN + GROUP BY
- 返却型 `OrganizerHistoryItem` に `chargeAmount`・`participantCount` を追加
- `OrganizerHistoryItem` コンポーネント側で `売上金額 = chargeAmount × participantCount` を計算して表示
- `chargeAmount` が null の場合は「—」表示

## 実装ステップ

1. **`apps/web/src/lib/events.ts`**
   - `getOrganizerHistory` の `select` に `chargeAmount: events.chargeAmount` を追加
   - 参加者数を subquery で取得するため `db.$count` or sqとして追加:
     ```ts
     // sq: registered 参加者数
     const participantCountSq = db
       .select({ count: count() })
       .from(eventParticipations)
       .where(
         and(
           eq(eventParticipations.eventId, events.id),
           eq(eventParticipations.status, 'registered'),
           isNull(eventParticipations.deletedAt)
         )
       );
     ```
   - select に `participantCount: sql<number>\`(${participantCountSq})\`` を追加
   - `OrganizerHistoryItem` 型に `chargeAmount: number | null`、`participantCount: number` を追加
   - `rows.map` で `chargeAmount`・`participantCount` を含めて返す

2. **`apps/web/src/app/[locale]/dashboard/organizer-history-item.tsx`**
   - Props の `event` 型に `chargeAmount: number | null`・`participantCount: number` を追加
   - 表示エリアに以下を追加:
     - 参加者数: `{event.participantCount} 名`
     - チャージ料: `event.chargeAmount ? ¥{event.chargeAmount.toLocaleString()} : '—'`
     - 売上金額: `event.chargeAmount ? ¥{(event.chargeAmount * event.participantCount).toLocaleString()} : '—'`
   - 既存の左側 `div.min-w-0` の下部に小さなフォントで追加するか、右側に数値を並べる

3. **翻訳キーを追加（`apps/web/messages/ja.json` / `en.json`）**
   - `dashboard.organizer_history_participants`: `"参加者数"` / `"Participants"`
   - `dashboard.organizer_history_charge`: `"チャージ料"` / `"Charge"`
   - `dashboard.organizer_history_sales`: `"売上"` / `"Sales"`

4. **`apps/web/src/app/[locale]/dashboard/page.tsx`**
   - `getOrganizerHistory` の呼び出し結果の型が変わるため、props 渡し部分を確認・修正

## 影響範囲

- `apps/web/src/lib/events.ts` — クエリ拡張・型追加
- `apps/web/src/app/[locale]/dashboard/organizer-history-item.tsx` — 表示列追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — props 確認
- `apps/web/messages/ja.json` — 翻訳キー追加
- `apps/web/messages/en.json` — 翻訳キー追加

## チェックリスト

- [ ] `getOrganizerHistory` の返却型に `chargeAmount`・`participantCount` を追加
- [ ] 参加者数を subquery で取得（`registered` ステータスのみカウント）
- [ ] `OrganizerHistoryItem` の Props に新フィールドを追加
- [ ] 参加者数・チャージ料・売上金額を表示（`chargeAmount = null` の場合は `—`）
- [ ] `ja.json` / `en.json` 両方に翻訳キーを追加
- [ ] dashboard ページの props 渡しを確認
- [ ] Playwright で動作確認（テストユーザーでログイン後に表示確認）
