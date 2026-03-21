# Issue #68: ux: 下書き保存ボタンにスピナー表示を追加

## 背景

下書き保存後に `router.refresh()` がサーバーと通信する数秒間、ボタンテキストの変化だけでは処理中か判別しにくく、UIがフリーズしたように見える。`Loader2` スピナーを追加して視覚的なフィードバックを改善する。

## 参照

- GitHub Issue: #68
- 関連 Issue: #67（トースト通知の実装）
- 関連ドキュメント: `docs/features/event-creation.md`

## 実装方針

`lucide-react` の `Loader2` コンポーネントを利用し、`isPending` が `true` の時にボタン内左側にスピナーを表示する。既存の `isPending` state は `useTransition` で管理済みなので、表示ロジックのみ追加する。

## 実装ステップ

1. `event-edit-form.tsx` に `Loader2` を import する
2. 下書き保存ボタン・申請ボタン・公開ボタンの3つに、`isPending` 時のスピナーを追加する
   - `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` をボタンテキストの左に配置
   - `isPending` が `false` の場合はスピナーを非表示にする

## 影響範囲

- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx`

## チェックリスト

- [ ] `Loader2` を `lucide-react` から import
- [ ] 下書き保存ボタンに `isPending` 時スピナー表示
- [ ] 申請ボタンに `isPending` 時スピナー表示
- [ ] 公開ボタンに `isPending` 時スピナー表示
- [ ] `animate-spin` クラスで回転アニメーション
