# Issue #16: ダッシュボードにイベント参加履歴を表示する

## 背景

ログインユーザーが参加表明・参加したイベントの履歴をダッシュボードで確認できるようにする。
`event_participations` テーブルが未存在のため、スキーマ追加・DB反映・シードデータ追加・表示実装まで一式を行う。
ユーザー要求: ダミーデータも含めて表示できること。

## 参照

- GitHub Issue: #16
- docs/features/event-participation.md（TBD確認済み: 予約制/チェックイン等は未確定のため minimal スキーマで実装）
- docs/architecture/decisions.md #1（ソフトデリート）, #2（UTC）, #3（イベントステートマシン）
- packages/db/src/schema.ts（既存スキーマ）
- apps/web/scripts/seed-test-accounts.mjs（シードスクリプト）

## 実装方針

- `event_participations` のステータスは `registered`（参加表明済み）/ `cancelled` の2値のみ
  - `attended`（実際に来た）はチェックイン機能が TBD のため含めない
- DB 反映は `pnpm --filter @e-be/db push`（drizzle-kit push）
- シードデータは seed-test-accounts.mjs に追加し冪等に実装
  - テスト用イベント（published・過去・完了済み）を複数作成し、test-user@e-be.internal の参加データを挿入
- ダッシュボードの `userType === "user"` セクションに参加履歴カードを追加

## 実装ステップ

1. **スキーマ追加** (`packages/db/src/schema.ts`)
   - `participationStatusEnum` を追加: `registered` | `cancelled`
   - `eventParticipations` テーブルを追加:
     - `id`, `createdAt`, `updatedAt`, `deletedAt`（commonColumns）
     - `eventId` → `events.id`
     - `userId` → `users.id`
     - `status`: `participationStatusEnum`
     - ユニーク制約: `(eventId, userId)` で重複防止（論理削除を考慮しない版でOK）

2. **DB 反映**
   ```bash
   cd packages/db && pnpm push
   ```

3. **参加履歴取得関数** (`apps/web/src/lib/events.ts`)
   - `getParticipationHistory(userId: string)` を追加
   - `event_participations` JOIN `events` で取得
   - deletedAt IS NULL（両テーブル）
   - 新しい順（events.startAt DESC）

4. **シードデータ追加** (`apps/web/scripts/seed-test-accounts.mjs`)
   - `upsertTestEventsAndParticipations(testUserId, orgId)` 関数を追加
   - テスト用イベント3〜4件（published 状態、endAt が過去）を組織に作成
   - test-user@e-be.internal が `registered` で参加している参加データを挿入
   - 冪等: イベントタイトルで存在確認してスキップ
   - `main()` 内で venue ユーザーの orgId を取得して呼び出し

5. **ダッシュボードに表示** (`apps/web/src/app/[locale]/dashboard/page.tsx`)
   - `userType === "user"` ブロックで `getParticipationHistory(user.id)` を並行取得に追加
   - 参加履歴カード（既存の主催履歴カードの隣 or 下）を追加

6. **翻訳キー追加** (`apps/web/messages/ja.json` / `en.json`)
   - `dashboard.participation_history_title`
   - `dashboard.participation_history_empty`
   - `dashboard.participation_status_registered`
   - `dashboard.participation_status_cancelled`

## 影響範囲

- `packages/db/src/schema.ts` — テーブル・enum 追加
- `apps/web/src/lib/events.ts` — 関数追加
- `apps/web/src/app/[locale]/dashboard/page.tsx` — 参加履歴カード追加
- `apps/web/scripts/seed-test-accounts.mjs` — シードデータ追加
- `apps/web/messages/ja.json` / `en.json` — 翻訳キー追加

## チェックリスト

- [ ] `event_participations` テーブルをスキーマに追加
- [ ] `pnpm --filter @e-be/db push` で DB 反映
- [ ] `getParticipationHistory` 関数を events.ts に追加
- [ ] seed スクリプトにテストイベント+参加データを追加（冪等）
- [ ] ダッシュボードに参加履歴カードを表示（userType === "user" のみ）
- [ ] ja.json / en.json に翻訳キーを追加
- [ ] `pnpm seed:test` でシード確認
- [ ] Playwright で動作確認
