# Issue #106: design: Hero CTA ボタンと How it works ステップ番号に amber カラーを適用

## 背景

LP の Hero セクションのプライマリ CTA ボタン（LinkButton default variant）と、「使い方」セクションのステップ番号バッジ（現在: 黒背景白文字）に `--brand` デザイントークンを適用し、バーらしい温かみのあるアクセントを持たせる。

#104 でトークンを追加し、#108 で `--amber` → `--brand` にリネーム済み。

## 参照

- GitHub Issue: #106
- 関連: #104（カラートークン追加）、#108（--amber/--violet → --brand/--feature リネーム）
- 実装対象: `apps/web/src/app/[locale]/page.tsx`、`apps/web/src/components/lp/link-button.tsx`

## 実装方針

| 要素 | 現在 | 変更後 |
|------|------|--------|
| Hero プライマリ CTA（LinkButton default variant） | `bg-primary text-primary-foreground` | `bg-brand text-brand-foreground` |
| How it works ステップ番号バッジ（丸） | `bg-foreground text-background` | `bg-brand text-brand-foreground` |

- ダッシュボード内の shadcn `<Button>` は変更しない（LP 専用変更）
- `link-button.tsx` の `default` variant を変更する（LP 専用なので問題なし）
- ダークモード対応は `--brand` トークンが既に light/dark 両方定義済みのため自動対応

## 実装ステップ

1. `apps/web/src/components/lp/link-button.tsx` の `default` variant を `bg-brand text-brand-foreground hover:bg-brand/80` に変更
2. `apps/web/src/app/[locale]/page.tsx` の How it works ステップ番号バッジ（line 288 付近）の `bg-foreground text-background` を `bg-brand text-brand-foreground` に変更

## 影響範囲

- `apps/web/src/components/lp/link-button.tsx`
- `apps/web/src/app/[locale]/page.tsx`

## チェックリスト

- [ ] `link-button.tsx` default variant が `bg-brand text-brand-foreground hover:bg-brand/80` になっている
- [ ] How it works ステップ番号バッジが `bg-brand text-brand-foreground` になっている
- [ ] ライトモード・ダークモード両方で amber 系の暖色が表示される
- [ ] ダッシュボード側の Button コンポーネントは変更していない
