# 通知

## 概要

プラットフォーム上の主要なアクションに対してユーザーに通知を送る。
通知は `notify(userId, type, payload)` を経由して送信する（実装詳細は `docs/architecture/decisions.md` #4 参照）。

## 通知一覧

| 通知タイプ | タイミング | 受信者 |
|-----------|-----------|--------|
| `event_request_received` | イベンターが `pending` に申請したとき | バー owner |
| `event_approved` | バーが承認したとき | イベンター |
| `event_rejected` | バーが却下したとき | イベンター |
| `event_cancelled` | イベントがキャンセルされたとき | 参加者全員 |
| `participation_received` | ユーザーが参加表明したとき | イベンター |
| `event_reminder` | イベント前日または数時間前 | 参加者全員 |
| `coupon_received` | クーポンを受け取ったとき（配布・受け渡し）| 受取人 |
| `permission_granted` | 自動許可が付与されたとき | イベンター |
| `permission_revoked` | 自動許可が取り消されたとき | イベンター |

## ビジネスルール

- 通知はアプリ内通知として記録し、既読管理を行う
- Push 通知（Expo Notifications）は初期実装で対応
- 将来: Web Push / メール / LINE 等の追加を想定（抽象層で吸収）

## TBD

- `event_reminder` の送信タイミング（前日 / 3時間前 / 両方？）
- ユーザーが通知種別ごとに受信 ON/OFF を設定できるか
