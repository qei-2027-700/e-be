# アーキテクチャ意思決定記録

早い段階で決定し、プロジェクト全体の構造に影響する設計方針をまとめます。
「なぜその設計にしたか」の理由を残すことで、後から参加するメンバーや AI が判断を再現できるようにします。

---

## 1. ソフトデリート（論理削除）

**決定**: 全テーブルで物理削除（`DELETE`）を使わず、`deleted_at` 列による論理削除を採用する。

**理由**:
- イベント履歴・参加記録・FCリクエストは「消えた事実」自体がデータになる
- 主催者の過去実績（公開/非公開）機能との整合性（非公開でも削除ではない）
- 誤操作時のリカバリが可能

**影響**:
- 全クエリに `WHERE deleted_at IS NULL` が必要（Drizzle のスコープで自動化）
- 管理者向けに論理削除済みデータの閲覧・復元 UI が将来必要になる

---

## 2. タイムゾーン設計

**決定**: DB には UTC で保存し、表示時にユーザーのロケールへ変換する。

**理由**:
- イベントバーは複数都市・将来的に海外展開も想定される
- サーバー側でタイムゾーンを意識した処理をすると、地域ごとに挙動が変わるバグが出やすい
- UTC 一元管理にすることで「どこで動かしても同じ結果」を保証する

**影響**:
- フロントエンドでは `Intl.DateTimeFormat` を使ってユーザーの端末タイムゾーンで表示
- 入力フォームでも UTC 変換してから保存する

---

## 3. イベントステートマシン

**決定**: イベントのステータス遷移を明示的なステートマシンで管理する。`ongoing` / `completed` は DB に保存せず、時刻から導出する。

**遷移図**:
```
【初回 / 許可なし】
draft → pending → published → cancelled
                → rejected

【許可済み主催者】
draft → published → cancelled
```

**ステータスの分類**:

| 種別 | ステータス | 保存場所 | 説明 |
|------|-----------|----------|------|
| 操作ベース | `draft` | DB | 作成中 |
| 操作ベース | `pending` | DB | バーへの開催申請中 |
| 操作ベース | `published` | DB | 公開済み（時刻により表示が変わる） |
| 操作ベース | `cancelled` | DB | キャンセル済み |
| 操作ベース | `rejected` | DB | バーに却下された |
| 時刻ベース | `ongoing` | 導出 | published かつ開始時刻〜終了時刻の間 |
| 時刻ベース | `completed` | 導出 | published かつ終了時刻を過ぎている |

**ステータス導出ロジック**:
```ts
// DB に保存するステータス
type StoredStatus = 'draft' | 'pending' | 'published' | 'cancelled' | 'rejected'

// API レスポンスで返すステータス（表示用）
type DisplayStatus = StoredStatus | 'ongoing' | 'completed'

function resolveStatus(event): DisplayStatus {
  if (event.status !== 'published') return event.status
  const now = new Date()
  if (now >= event.end_at) return 'completed'
  if (now >= event.start_at) return 'ongoing'
  return 'published'
}
```

**遷移の権限**:
- `draft → pending` — 主催者（許可なし or 初回）
- `draft → published` — 主催者（許可済み）
- `pending → published` — バー owner（許可を付与しつつ承認）
- `pending → rejected` — バー owner
- `published → cancelled` — 主催者 or バー owner（開始前のみ）
- `published → cancelled` — バー owner のみ（ongoing 表示中も可）

**イベントの必須項目**:
- `start_at`（開始時刻）・`end_at`（終了時刻）は `draft` 中は NULL 許容
- `pending` への遷移時にバリデーションで必須チェック（日時なしでは申請不可）
- これにより「企画を先に作り、日程は後から決める」という主催者の自然なフローを実現する

**下書きの可視性**:
- イベントがバーに紐づいた時点で、バー owner のダッシュボードに `draft` として表示される
- バー owner は「誰かがうちでイベントを計画している」ことを早期に把握できる
- バー owner が draft に対してどんなアクションを取れるかは **TBD**
- バーを選ばずに draft を作れるかどうかは **TBD**（他の機能との兼ね合いで決める）

**理由**:
- cron 不要でインフラがシンプル。cron 失敗によるステータスずれが起きない
- `completed` → `draft` のような不正な遷移を防ぐ
- 遷移ルールが散在すると、追加条件（承認者の権限チェック等）の漏れが起きる
- ステータスに紐づく副作用（通知等）を一箇所に集中できる

---

## 4. 通知基盤の抽象化

**決定**: 通知送信を `notify(userId, type, payload)` の抽象層に集約する。直接 Expo Push / メール API を呼ばない。

**理由**:
- 初期は Expo Notifications のみだが、将来 Web Push・メール・LINE 等が加わる想定
- チャンネル（Push/Email）の追加時にビジネスロジックを変更しなくて済む
- 通知の送信記録・既読管理を一箇所で実装できる

---

## 5. ファイルストレージのパス設計

**決定**: Supabase Storage のパスを `{type}/{orgId}/{entityId}/{filename}` で統一する。

**理由**:
- パスが変わると既存の URL がすべて壊れるため、最初に決める必要がある
- 組織ID を含めることで RLS（Row Level Security）と組み合わせたアクセス制御が可能
- 将来ストレージサービスを変更する場合もパターンが一貫していると移行しやすい

---

## 6. 監査ログ

**決定**: イベント承認・キャンセル・ロール変更などの主要操作を `audit_logs` テーブルに記録する。

**理由**:
- 「誰がいつ承認したか」は後から取得できない（取らなければ永遠に失われる）
- FC立候補の審査プロセスに透明性が必要
- トラブル発生時の調査に不可欠

**記録対象（初期）**:
- イベント: 承認・却下・キャンセル
- FCリクエスト: ステータス変更
- ロール: 付与・剥奪

---

## 7. 課金・プランシステム

**決定**: Stripe を前提とした設計を最初から入れる。導入前でも DB スキーマに列を確保する。

**理由**:
- `plan` 列を後から追加する場合、既存ユーザーのデフォルト値や機能制限の再実装が必要になる
- 機能制限の判定を `canUseFeature()` に集約しておくことで、プラン追加時の修正箇所を最小化できる

詳細: [billing-premium.md](../.claude/steering/billing-premium.md)（実装計画）

---

## 8. 多言語対応（i18n）

**決定**: 日本語・英語の2言語対応を前提とし、UI テキストをハードコードしない。

**理由**:
- テキストをハードコードした後から i18n を入れると、全ファイルの書き換えが必要になる
- Web は `next-intl`、Mobile は `i18next` を採用

詳細: [i18n.md](../.claude/steering/i18n.md)（実装計画）

---

## 9. 店舗イメージカラー

**決定**: 店舗ごとにイメージカラーを設定できる。DB には HEX 文字列で保存し、UI は段階的に拡張する。

**フェーズ1（初期実装）**: プリセットパレットから選択のみ
**フェーズ2（拡張）**: カスタム HEX コード自由入力を追加

DB カラムは最初から `text` 型で HEX を保存するため、フェーズ2への移行でスキーマ変更は不要。

**使用箇所**: 店舗カードの背景色・文字色

**文字色の自動判定**:
背景色に対して WCAG コントラスト比を計算し、白 (`#FFFFFF`) か黒 (`#000000`) を自動選択する。
手動で文字色を設定させない。

```ts
// 輝度から白黒を自動判定
function getTextColor(bgHex: string): '#FFFFFF' | '#000000' {
  // WCAG relative luminance で判定
}
```

**バリデーション**: `#` + 6桁の HEX 文字（`/^#[0-9A-Fa-f]{6}$/`）

**理由**:
- 最初からカスタムカラーに対応するより、プリセットで統一感を保ちつつ拡張できる
- DB を HEX で持つことで UI の変更だけで自由入力に移行できる
- 文字色を自動判定することでアクセシビリティ問題を防ぐ

---

## 11. ロール設計（アカウントとコンテキスト）

**決定**: ユーザーのロールはアカウント種別ではなく、組織へのメンバーシップで決まる。

**ロール一覧**:

| ロール | スコープ | 説明 |
|--------|----------|------|
| `user` | プラットフォーム全体 | ログイン済みの全ユーザー。参加者にもなれる |
| `org:owner` | 組織単位 | 事業者責任者。1組織につき必ず1人 |
| `org:member` | 組織単位 | 従業員。イベント作成・管理が可能 |
| `platform:admin` | 全体 | システム管理者（内部スタッフ用・緊急対応）|

**理由**:
- バーの主催者が別のバーのイベントに参加者として参加できる（同一アカウント）
- Airbnb・Connpass と同じ「コンテキストによってロールが変わる」モデル
- `users` テーブルに `role` 列を持たず、`organization_members` テーブルで管理

**DB 設計**:
```ts
// organization_members テーブル
orgId:     → organizations.id
userId:    → users.id
role:      'owner' | 'member'
deletedAt: timestamp  ← 退会はソフトデリート

// 制約: UNIQUE (org_id) WHERE role = 'owner'（owner は1組織に1人）
```

---

## 12. 主催者許可システム（bar_host_permissions）

**決定**: バーが特定ユーザーに「このバーでイベントを開催してよい」という許可を管理する。

**仕組み**:
- 許可なし → イベントは `draft → pending` でバー owner の承認が必要
- 許可あり → イベントは `draft → published` で即公開
- バー owner が許可を取り消せる（revoke）
- 許可取り消しは新規イベントにのみ影響。既存の `published` / `ongoing` イベントはそのまま続行

**DB 設計**:
```ts
// bar_host_permissions テーブル
barId:      → organizations.id
userId:     → users.id
grantedAt:  timestamp
revokedAt:  timestamp  ← 取り消しはソフトデリートと同じ考え
grantedBy:  → users.id（許可した owner）
```

**理由**:
- 1回許可を出したら毎回承認しなくていい（運用コスト削減）
- 信頼関係は「主催者ごと」に管理したい
- 許可の付与・取り消しは `audit_logs` に記録する

---

## 13. 組織 owner の権限移譲

**決定**: `org:owner` は1組織につき1人。別のメンバーへの移譲機能を設ける。

**仕組み**:
- owner が `member` を選択して移譲を実行
- 新 owner が `owner` に、元 owner が `member` に変わる（組織からは抜けない）
- 移譲は取り消し不可の操作 → UI に確認ステップ必須
- `audit_logs` に記録（`action: 'ownership_transferred'`）

**専用関数**:
```ts
// canTransition() ではなく専用関数で実装
transferOwnership(orgId, fromUserId, toUserId)
```

**理由**:
- 共同経営者の交代・引き継ぎに対応
- DB 制約（`UNIQUE (org_id) WHERE role = 'owner'`）でデータ整合性を保証
