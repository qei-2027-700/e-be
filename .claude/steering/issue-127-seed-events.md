# Issue #127: feat: 開催予定イベントのサンプルデータを12件に増やす（seed スクリプト整備）

## 背景

`/events` ページの表示確認・都道府県フィルターの動作検証ができるよう、`published` 状態のサンプルイベントを 12 件シードするスクリプトを新規作成する。
東京・大阪・福岡の複数都道府県にまたがるテスト用店舗を 4 件作成し、各店舗に 3 件ずつイベントを紐付ける。

## 参照

- GitHub Issue: #127
- 関連ドキュメント: `docs/features/event-search.md`
- 既存 seed スクリプト: `apps/web/scripts/seed-test-accounts.mjs`（形式の参考）
- スキーマ定義: `packages/db/src/schema.ts`（`organizations`・`events` テーブル）

## 実装方針

- 既存の `seed-test-accounts.mjs` と同じ ESM (.mjs) 形式、同じ `.env.local` 読み込みパターンを踏襲する
- `test-venue@e-be.internal` の `userId` と既存の `test-company` の `companyId` をクエリで取得し、それを owner として利用する
- 各 INSERT は `ON CONFLICT DO NOTHING` / `DO UPDATE` で冪等に実行できるようにする（slug を一意キーとして利用）
- `thumbnailUrl` カラムは Issue #126 でスキーマ追加予定のため、今回は未設定（カラムが存在しない前提）

### テーブル依存関係

```
companies (既存: test-company)
  └── organizations (新規4件: slug で冪等判定)
        └── organization_members (owner: test-venue ユーザー)
              └── events (新規12件: title + org_id で冪等判定)
```

## 実装ステップ

1. **`apps/web/scripts/seed-events.mjs` を新規作成**
   - `seed-test-accounts.mjs` と同様の ESM ヘッダー（`loadEnv`・Supabase client・postgres client）
   - `test-venue@e-be.internal` の `userId` を DB から取得（`SELECT id FROM users WHERE email = ...`）
   - `test-company` の `companyId` を DB から取得（`SELECT id FROM companies WHERE slug = 'test-company'`）
   - 以下 4 組織を `upsertOrg()` 関数で冪等挿入：

     | slug | name | prefecture | address |
     |------|------|-----------|---------|
     | test-bar-shibuya | テストバー渋谷 | 東京都 | 東京都渋谷区道玄坂1丁目 |
     | test-bar-shinjuku | テストバー新宿 | 東京都 | 東京都新宿区歌舞伎町1丁目 |
     | test-bar-osaka | テストバー大阪 | 大阪府 | 大阪府大阪市北区梅田1丁目 |
     | test-bar-fukuoka | テストバー福岡 | 福岡県 | 福岡県福岡市博多区博多駅前3丁目 |

   - 各組織に `owner` ロールで `test-venue` ユーザーを `organization_members` に追加（冪等）
   - 各組織に 3 件ずつイベントを `upsertEvent()` 関数で挿入（`title + org_id` で `ON CONFLICT` できない場合は slug 相当のユニーク列がないため、`SELECT` で存在確認してから `INSERT`）
   - イベントのバリエーション（各店舗共通の構成）：
     - イベント1: `chargeAmount: 1000`、`maxParticipants: 10`、`start_at`: 現在から 7 日後
     - イベント2: `chargeAmount: 0`（無料）、`maxParticipants: 30`、`start_at`: 現在から 14 日後
     - イベント3: `chargeAmount: 3000`、`maxParticipants: 5`、`start_at`: 現在から 21 日後
   - 各イベントの `nearestStation` は店舗エリアに合わせた駅名を設定（例: 渋谷→「渋谷」、新宿→「新宿」、大阪→「梅田」、福岡→「博多」）
   - `status: 'published'`、`is_public: true` を全件に設定

2. **`apps/web/package.json` の `scripts` に追加**
   ```json
   "seed:events": "node scripts/seed-events.mjs"
   ```

3. **ルート `package.json` の `scripts` に追加**
   ```json
   "seed:events": "node apps/web/scripts/seed-events.mjs"
   ```
   （既存の `"seed:test": "node apps/web/scripts/seed-test-accounts.mjs"` に倣う）

4. **動作確認**
   - `pnpm seed:events` を実行してエラーなく完了することを確認
   - 2 回目の実行で `⏭` スキップログが出て冪等に動作することを確認
   - `/events` ページで 12 件のイベントが表示されることを Playwright で確認

## 影響範囲

- **新規作成**: `apps/web/scripts/seed-events.mjs`
- **変更**: `apps/web/package.json`（scripts 追加）
- **変更**: `package.json`（scripts 追加）
- 既存のテストデータ（`test-bar`・`test-venue@e-be.internal`）には影響なし

## チェックリスト

- [ ] `seed-events.mjs` が `pnpm seed:events` で実行できる
- [ ] 4 組織（東京×2・大阪×1・福岡×1）が DB に作成される
- [ ] 各組織の `organization_members` に `test-venue` が `owner` で追加される
- [ ] 12 件のイベントが `status='published'`・`is_public=true`・`start_at` が未来 で登録される
- [ ] イベントに `chargeAmount`・`maxParticipants`・`nearestStation` のバリエーションがある
- [ ] 2 回実行しても重複データが作成されない（冪等性）
- [ ] `/events` ページで 12 件が表示されることを確認（Playwright）
