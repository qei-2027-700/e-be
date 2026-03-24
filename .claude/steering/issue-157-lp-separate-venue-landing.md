# Issue #157: LP: 参加者/主催者向けに整理し、事業者向けLPを分離する

## 背景

現状のトップLP（`/[locale]`）は参加者・主催者・事業者（店舗管理者）向けの訴求が混在しており、ユーザーが「自分向けの価値」を瞬時に理解しづらい。特に事業者向けの価値（店舗管理、承認フロー、分析など）は参加者/主催者の価値と文脈が異なるため、トップLPの主ターゲットを「イベント参加者 / 主催者」に寄せつつ、事業者向けは専用LPに切り出して導線で繋ぐ。

## 参照

- GitHub Issue: #157
- 関連ドキュメント:
  - docs/features/store-creation.md（事業者の申請/店舗作成の文脈）
  - docs/features/event-approval.md（事業者の承認フローの文脈）
  - docs/features/event-participation.md（参加者の参加表明の文脈）
- アーキテクチャ:
  - docs/architecture/decisions.md #8（i18n）
  - docs/architecture/decisions.md #9（イメージカラー）

## 実装方針

- トップLPは「参加者/主催者」の価値提案に絞り、事業者向けの内容は“専用LP”に移動する。
- 導線はトップLPのヘッダー（Nav）および/またはフッター/本文の分かりやすい位置に「事業者の方はこちら」を設置し、トップLPのストーリーを邪魔しない形で配置する。
- 文言はすべて `next-intl` のメッセージに寄せ、既存のユーザー導線（signin/signup/dashboard）を維持する。
- URLスラッグは Issue に **TBD** として記載されているため、実装前に決定が必要（例: `/[locale]/venues` / `/[locale]/for-venues`）。

## 実装ステップ

1. 既存トップLP（`apps/web/src/app/[locale]/page.tsx`）のセクション構成を棚卸しし、事業者向け訴求（店舗管理/承認/分析など）として扱うべき要素をリスト化する。
2. 事業者向けLPの URL スラッグを決める（Issueに記載なし、要確認）。
3. 事業者向けLPページを新規作成する。
   - `apps/web/src/app/[locale]/{slug}/page.tsx` を追加
   - コンテンツは「店舗作成/プロフィール」「開催申請の承認」「分析」など、事業者の価値に寄せて構成（詳細は docs/features を参照）
4. トップLPを参加者/主催者向けに整理する。
   - 事業者向け訴求を削除/移動し、参加者（参加表明）・主催者（イベント作成）側の文脈で再構成
5. トップLPに事業者向けLPへの導線リンクを追加する。
   - 追加候補: `apps/web/src/components/lp/nav-bar.tsx` / `apps/web/src/app/[locale]/page.tsx` / `apps/web/src/components/layout/app-footer.tsx`
6. `apps/web/messages/**` に必要な翻訳キーを追加し、ハードコードを残さない。
7. ルーティング・リンクのE2E観点を簡易確認（手動確認でOK）。既存導線（signin/signup/dashboard）に影響がないことを確認する。

## 影響範囲

- LP本体:
  - `apps/web/src/app/[locale]/page.tsx`
- 新規ページ:
  - `apps/web/src/app/[locale]/{slug}/page.tsx`（slug はTBD決定後）
- 共有レイアウト/導線（必要な場合のみ）:
  - `apps/web/src/components/lp/nav-bar.tsx`
  - `apps/web/src/components/layout/app-footer.tsx`
- i18n:
  - `apps/web/messages/**`

## チェックリスト

- [ ] トップLPが参加者/主催者向けのストーリーとして一貫している
- [ ] 事業者向けLPが別ページとして存在し、トップLPから適切に遷移できる
- [ ] 文言がすべて i18n 経由になっている（ハードコードなし）
- [ ] 既存の signin/signup/dashboard の導線が維持されている

