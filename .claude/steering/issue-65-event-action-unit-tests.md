# Issue #65: テストケースの追加：イベント関連

## 背景

イベント管理の Server Actions について、セキュリティ上重要な2つのケースがテストされていない:
1. **他人のイベントを管理できないこと** — `updateEventDraft` / `submitEvent` / `publishEvent` に `eq(events.userId, dbUser.id)` ガードがあるが、テストで保証されていない
2. **自分がイベントを主催していても、別イベントに参加者として申請できること** — `events` と `event_participations` は独立したテーブルなので制約はないはずだが、テストで明示する

## 参照

- GitHub Issue: #65
- 関連ドキュメント: `docs/features/event-creation.md`, `docs/features/event-participation.md`
- テスト対象: `apps/web/src/lib/actions/event.ts`

## 実装方針

- **Vitest** を導入してユニットテストを書く（Next.js App Router / Server Actions と相性が良い）
- `db`（drizzle）と `getDbUser()` / `getUser()` をモックして、DBアクセスなしで Server Actions の分岐をテストする
- テストファイルは `apps/web/src/lib/actions/__tests__/event.test.ts` に配置

## 実装ステップ

1. **vitest のセットアップ**（`apps/web/`）
   - `pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths` をインストール
   - `apps/web/vitest.config.ts` を作成（`environment: 'node'`, `tsconfig-paths` プラグイン）
   - `apps/web/package.json` の `scripts` に `"test": "vitest run"` と `"test:watch": "vitest"` を追加

2. **モックの準備**
   - `apps/web/src/lib/actions/__tests__/event.test.ts` を作成
   - `vi.mock('@/lib/db', ...)` で drizzle db をモック
   - `vi.mock('@/lib/auth', ...)` で `getDbUser` / `getUser` をモック
   - `vi.mock('@/lib/events', ...)` で `checkEventConflict` / `hasBarHostPermission` をモック

3. **テストケース 1: 他人のイベントを管理できないこと**
   - `updateEventDraft`: userB のイベントに userA がアクセス → `{ error: 'not_found' }` を返す
   - `submitEvent`: 同様
   - `publishEvent`: 同様
   - 実装: `db.select` のモックが空配列を返すと `not_found` になる（`eq(events.userId, dbUser.id)` がフィルタ役割を果たすため）

4. **テストケース 2: 自分がイベントを主催していても別イベントに参加できること**
   - `event_participations` への INSERT はイベント主催者チェックを行わないことをコードで確認
   - `apps/web/src/lib/actions/participation.ts`（存在する場合）の参加申請アクションをテスト
   - 存在しない場合は Note に記載

5. **turbo.json にテストタスクを追加**（任意）
   - `"test": { "cache": false }` を追加してモノレポから `turbo test` できるようにする

## 影響範囲

- `apps/web/package.json`（scripts・devDependencies 追加）
- `apps/web/vitest.config.ts`（新規作成）
- `apps/web/src/lib/actions/__tests__/event.test.ts`（新規作成）

## チェックリスト

- [ ] vitest がインストールされ `pnpm test` で実行できる
- [ ] 他人のイベントを `updateEventDraft` で更新しようとすると `{ error: 'not_found' }` が返る（テストがグリーン）
- [ ] 他人のイベントを `submitEvent` で申請しようとすると `{ error: 'not_found' }` が返る
- [ ] 他人のイベントを `publishEvent` で公開しようとすると `{ error: 'not_found' }` が返る
- [ ] 自分がイベント主催者でも参加申請できることがテストで確認される（参加アクションが存在する場合）
- [ ] `pnpm test` が全テストグリーンで終了する
