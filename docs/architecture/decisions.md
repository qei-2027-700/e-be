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

## 11. テナント階層・ユーザー種別・ロールの設計

**決定**: プラットフォームは `companies`（法人）→ `organizations`（店舗）のフラット2層構造を採用する。ユーザーには「アカウント種別（userType）」と「店舗内ロール」の2層が存在する。

### テナント階層

```
companies（法人）              ← 請求・プラン管理の単位
└── organizations（店舗）      ← brand フィールドでブランド区別
    └── organization_members  ← 店舗レベルのロール管理
```

- `company_members` テーブルは作らない。「法人への所属」は「その法人の店舗のいずれかに所属していること」で判定する
- 1法人が複数ブランド・複数店舗を持つ場合は `organizations.brand` フィールドで区別する
- 請求・プランは `companies` 単位で管理する

### 層1: ユーザー種別（users.userType）

プラットフォーム全体に渡る種別。`users` テーブルで管理する。

| userType | 説明 | 法人・店舗作成 |
|----------|------|--------------|
| `user` | 一般利用者。イベンター・参加者 | ✗（申請が必要） |
| `venue_user` | 承認済み店舗事業者。法人に所属 | ✗（管理者が承認時に作成） |
| `system_user` | システム管理者。内部スタッフ | ○（管理者画面から直接作成） |

**デフォルト**: サインアップ時は `user`。事業者申請が承認されると `venue_user` に昇格。

### 層2: 店舗内ロール（organization_members.role）

店舗に所属してからの役割。`organization_members` テーブルで管理する。

| role | スコープ | 説明 |
|------|----------|------|
| `owner` | 店舗単位 | 店舗責任者。1店舗につき必ず1人 |
| `member` | 店舗単位 | スタッフ。イベント作成・管理が可能 |

**理由**:
- バーの主催者が別のバーのイベントに参加者として参加できる（同一アカウント）
- company_members を作らないことで構造をシンプルに保つ
- ブランド区別は DB エンティティではなくフィールドで表現（過剰設計を避ける）
- アカウント種別（何者か）と店舗内権限（何ができるか）を分離することで責務が明確になる

**DB 設計**:
```ts
// users テーブル（userType 追加）
userType: 'user' | 'venue_user' | 'system_user'  ← default: 'user'

// companies テーブル（新規）
id, name, slug, stripeCustomerId, plan, planExpiresAt, createdAt, updatedAt, deletedAt

// organizations テーブル（companyId・brand 追加）
companyId: → companies.id
brand: text（nullable。複数ブランドを持つ場合に使用）

// organization_members テーブル（変更なし）
orgId:     → organizations.id
userId:    → users.id
role:      'owner' | 'member'
deletedAt: timestamp
// 制約: UNIQUE (org_id) WHERE role = 'owner'
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

---

## 14. 事業者申請フロー（operator_applications）

**決定**: 一般ユーザーが店舗事業者になるには「法人登録申請」→管理者承認のフローを踏む。法人・店舗の直接作成はできない。

**フロー**:
```
利用者がフォームから法人登録を申請（法人名・最初の店舗情報を入力）
  → operator_applications に status: 'pending' で保存
    → 管理者が確認・申請者と連絡
      → 承認: companies + organizations + organization_members を作成
               users.userType を 'venue_user' に更新
      → 却下: status を 'rejected' に更新
```

**管理者による直接作成**:
- `userType = 'system_user'` のユーザーは管理者画面（`/admin`）から法人・店舗を直接作成できる
- この場合 `operator_applications` を経由しない

**DB 設計**:
```ts
// operator_applications テーブル（新規）
id:            uuid
userId:        uuid → users.id（申請者）
status:        'pending' | 'approved' | 'rejected'
// 申請時の法人情報
companyName:   text（法人名、最大100文字）
// 申請時の最初の店舗情報
orgName:       text（店舗名、最大50文字）
orgSlug:       text（英数字・ハイフンのみ、最大50文字）
brand:         text（nullable、ブランド名）
description:   text（nullable）
address:       text（nullable）
// 管理者操作
reviewedBy:    uuid → users.id（nullable）
reviewedAt:    timestamp（nullable）
reviewNote:    text（nullable、却下理由等）
// 共通
createdAt, updatedAt, deletedAt
```

**理由**:
- 無審査で誰でも店舗を作れると質の担保ができない
- 管理者が申請者と直接連絡を取ることでプラットフォームの信頼性を確保する
- 申請情報を DB に保持することで審査記録が残る（監査ログと連携）

**承認時の処理**（トランザクション）:
1. `companies` にレコードを作成
2. `organizations` に `companyId` を紐づけてレコードを作成
3. `organization_members` に `role: 'owner'` でレコードを作成
4. `users.userType` を `'venue_user'` に更新
5. `operator_applications.status` を `'approved'` に更新
6. `audit_logs` に記録

---

## 15. FC店舗の閲覧権限（fc_relationships）

**決定**: FC加盟店は別法人が運営するが、本部（フランチャイザー）が売上等を閲覧できる権限を `fc_relationships` テーブルで管理する。

**仕組み**:
- FC加盟店は独立した `companies` + `organizations` として登録される
- 本部は `fc_relationships` を通じて加盟店の閲覧権限のみを持つ（管理権限なし）
- 将来的に売上レポートや分析機能と連携する

**DB 設計**:
```ts
// fc_relationships テーブル（新規）
id:               uuid
franchisorOrgId:  uuid → organizations.id（本部店舗）
franchiseeOrgId:  uuid → organizations.id（FC加盟店）
grantedBy:        uuid → users.id
grantedAt:        timestamp
revokedAt:        timestamp（nullable）
createdAt, updatedAt, deletedAt
```

**理由**:
- FC加盟店の実運営権限は加盟店オーナーが持つ（本部は介入しない）
- 閲覧権限のみを軽量なテーブルで表現することでシンプルさを保つ
- 将来の FC 機能拡張に対応できる構造
