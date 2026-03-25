# Issue #161: feat: 主催者をwatchしてイベント作成/公開を通知

## 背景

特定の主催者（ユーザー）を watch できるようにし、watch 対象が主催イベントを作成・公開したタイミングでフォロワー（watcher）へ通知を届けたい。

既存の通知基盤（DB の `notifications` と `sendNotification()`）は存在するが、「ユーザーwatch」という購読モデルと、イベントの状態遷移に紐づく通知生成の設計（重複防止・権限/プライバシー・UI導線）を具体化する必要がある。

## 参照

- GitHub Issue: #161
- 関連ドキュメント:
  - `docs/features/notifications.md`（通知タイプ一覧・方針）
  - `docs/features/event-creation.md`（`draft → pending/published`）
  - `docs/features/event-approval.md`（`pending → published/rejected` の業務フロー）
  - `docs/features/organizer-history.md`（主催履歴の公開/非公開方針の将来整合）
- アーキテクチャ:
  - `docs/architecture/decisions.md` #1（ソフトデリート）
  - `docs/architecture/decisions.md` #3（ステートマシンと副作用の集約）
  - `docs/architecture/decisions.md` #4（`notify(userId, type, payload)` 抽象）

## 実装方針

- watch 関係（watcher → target）を DB に永続化し、解除はソフトデリートで扱う。
- 通知は既存の `notifications` テーブルへ保存し、既読管理は `read_at` を用いる（すでに列がある）。
- 通知生成は「イベントの状態遷移」に寄せる（publish/approve の箇所に集約）。
- MVP は **in-app 通知**（一覧表示）を必須とし、Push/Email は抽象層の先（将来）に回す。

### 決定（確定）

- 通知の発火タイミング: **`published` のみ**（`draft` / `pending` では通知しない）
- watch 導線:
  - **イベント詳細画面**の「主催ユーザー名」横に favorite 風のアイコンボタン（watch/unwatch）

### 要確認（TBD）

- 「主催イベント」の定義:
  - `events.user_id` が対象ユーザーで良いか（共同主催を将来入れるなら拡張余地が必要）
- 重複防止の方法:
  - 実装上の idempotency（同一イベント・同一受信者への重複通知を防ぐ）をどう保証するか

## 実装ステップ

1. 仕様確定（TBD の解消）
   - 「主催イベント」= `events.user_id` で問題ないかを確認する。
   - 重複防止（idempotency）方針を決める。
2. DB: watch 関係テーブルを追加
   - 例: `user_watches`（`watcher_user_id`, `target_user_id`, `created_at`, `updated_at`, `deleted_at`）
   - アクティブ watch の一意性を担保（`uniqueIndex(watcher_user_id, target_user_id)` + ソフトデリート運用）
3. 通知タイプを追加
   - `packages/db/src/notification-types.ts` に watch 用の type を追加（例: `WATCHED_ORGANIZER_EVENT_PUBLISHED`）
   - `docs/features/notifications.md` の表にも追記（仕様の一貫性確保）
4. 通知生成（イベント状態遷移の副作用）
   - `draft → published`（許可済み主催者の publish）時に、target（主催者）を watch しているユーザー一覧へ通知を生成
   - `pending → published`（バー owner 承認）導線が実装されている/される場合は同様に通知
   - 重複防止:
     - 例: (受信者, type, eventId) で「既に通知済みならスキップ」できる実装を入れる（DB 参照 or dedupe key を導入）
5. UI: watch 導線を追加
   - イベント詳細画面の主催ユーザー名の隣に、watch/unwatch のアイコンボタンを追加
   - 未ログイン時は sign-in へ誘導（またはボタン非表示）など挙動を決める
6. UI: 通知一覧の表示 + 既読
   - ダッシュボード内に `/notifications` を追加し、`notifications` を一覧表示
   - クリックで該当イベントへ遷移（payload の `eventId` などから）
   - 既読操作（一覧表示時に既読化 or 明示ボタン）を決めて実装
7. テスト
   - publish 時に watcher へ通知が作られること
   - watch 解除後は通知が作られないこと
   - 重複通知が発生しないこと（同じ publish が二重実行された想定）

## 影響範囲

- DB スキーマ:
  - `packages/db/src/schema.ts`（`user_watches` 追加）
  - `packages/db/src/notification-types.ts`（通知タイプ追加）
- 通知生成/取得:
  - `apps/web/src/lib/notify.ts`（既存。必要なら型/使い方整理）
  - `apps/web/src/lib/actions/event.ts`（publish 処理に副作用追加）
  - （承認機能がある場合）承認アクションの server action
- UI:
  - `apps/web/src/app/[locale]/events/[eventId]/page.tsx` 等（watch ボタン追加候補）
  - `apps/web/src/app/[locale]/dashboard/**`（通知一覧ページ追加候補）
- Docs:
  - `docs/features/notifications.md`

## チェックリスト

- [ ] watch（追加/解除）が DB に永続化され、ソフトデリートで扱える
- [ ] watch 対象のイベントが公開されたとき、watcher に通知が作成される
- [ ] 同一イベントについて通知が重複生成されない
- [ ] 通知一覧で未読/既読が扱える
- [ ] 導線（watch 操作）と権限/プライバシーが破綻しない（TBD を解消）
