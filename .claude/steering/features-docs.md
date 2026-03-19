# docs/features/ 整備状況

## 作成済み（フェーズ1）

| ファイル | 内容 | 状態 |
|---------|------|------|
| `event-lifecycle.md` | イベントのステータス・状態導出・遷移権限 | ✅ 完了 |
| `organization-roles.md` | ロール設計・owner 移譲・メンバー管理 | ✅ 完了 |
| `host-permissions.md` | 主催者許可システム・付与・取り消し | ✅ 完了 |
| `bar-availability.md` | 利用不可枠・カレンダー・重複チェック | ✅ 完了 |
| `event-creation-flow.md` | draft→published フロー・カレンダー選択 | ✅ 完了 |

## 未作成（フェーズ2 — 仕様を詰めてから）

| ファイル | 未決事項 |
|---------|----------|
| `event-participation.md` | 参加の仕組み（予約・定員・キャンセル）|
| `notifications.md` | 通知のタイミング・種類 |
| `bar-profile.md` | バープロフィールの内容・表示項目 |
| `billing.md` | Stripe 実装の詳細（canUseFeature は architecture に記載済み）|

## TBD 一覧（フェーズ1内）

| ファイル | TBD 内容 |
|---------|----------|
| `event-lifecycle.md` | キャンセル時の返金処理（課金導入後） |
| `bar-availability.md` | pending イベントをカレンダーで仮押さえ表示するか |
| `event-creation-flow.md` | バーなし draft を作れるか |
| `event-creation-flow.md` | バー owner が draft に対してできるアクション |
| `event-creation-flow.md` | published 後の内容編集可否 |
