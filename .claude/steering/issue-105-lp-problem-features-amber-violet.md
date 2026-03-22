# Issue #105: design: LP の課題セクション・Features セクションのアドホックカラーを amber/violet トークンに統一

## 背景

LP ページ（`apps/web/src/app/[locale]/page.tsx`）の Pain セクションと Features セクションで
`blue-500` / `indigo-500` / `orange-500` 等の Tailwind アドホックカラーが散在している。
`--brand`（琥珀） / `--feature`（紫） デザイントークンを活用し、配色をブランドイメージに合わせつつ整理する。

## 参照

- GitHub Issue: #105
- 関連ドキュメント: なし
- 既存実装: `apps/web/src/app/[locale]/page.tsx`
- デザイントークン定義: `apps/web/src/app/globals.css`

## 実装方針

以下のマッピングに従って色を置き換える。

| ユーザー区分 | 現在の色 (Tailwind) | 変更後のトークン | 補足 |
|------------|-------------------|----------------|------|
| バーオーナー (Venue) | `blue-500` / `blue-700` / `blue-50` | `feature` 系 (紫) | 既存の `--feature` を使用 |
| イベンター (Eventer) | `indigo-500` / `indigo-700` / `indigo-50` | `feature` 系 (紫) | 濃淡が必要な場合は opacity 等で調整 |
| 参加者 (Participant) | `orange-500` / `orange-700` / `orange-50` | `brand` 系 (琥珀) | 既存の `--brand` を使用 |

※ `globals.css` にて `--brand` と `--amber`、`--feature` と `--violet` は同じ値が割り当てられているが、Issue 本文の指示に従い `brand` / `feature` トークンを優先的に使用する。

## 実装ステップ

### 1. Pain セクションの修正 (`apps/web/src/app/[locale]/page.tsx`)

- **バーオーナー (Venue)**:
  - `border-t-blue-500` -> `border-t-feature`
  - `text-blue-700` -> `text-feature`
  - `text-blue-500` (アイコン) -> `text-feature`
- **イベンター (Eventer)**:
  - `border-t-indigo-500` -> `border-t-feature`
  - `text-indigo-700` -> `text-feature`
  - `text-indigo-500` (アイコン) -> `text-feature`
- **参加者 (Participant)**:
  - `border-t-orange-500` -> `border-t-brand`
  - `text-orange-700` -> `text-brand`
  - `text-orange-500` (アイコン) -> `text-brand`

### 2. Features セクションの修正 (`apps/web/src/app/[locale]/page.tsx`)

- **店舗管理者向け (Venue)**:
  - `bg-blue-50/50` -> `bg-feature/5` (または適切な薄い色)
  - `ring-blue-100` -> `ring-feature/20`
  - `text-blue-900` -> `text-feature`
  - `bg-blue-600` -> `bg-feature`
- **イベント主催者向け (Eventer)**:
  - `bg-indigo-50/50` -> `bg-feature/5`
  - `ring-indigo-100` -> `ring-feature/20`
  - `text-indigo-900` -> `text-feature`
  - `bg-indigo-600` -> `bg-feature`
- **イベント参加者向け (Participant)**:
  - `bg-orange-50/50` -> `bg-brand/5`
  - `ring-orange-100` -> `ring-brand/20`
  - `text-orange-900` -> `text-brand`
  - `bg-orange-600` -> `bg-brand`

## 影響範囲

- `apps/web/src/app/[locale]/page.tsx` の表示配色のみ

## チェックリスト

- [ ] Pain セクションの 3 つのカードの色が `feature` / `brand` トークンに置き換わっている
- [ ] Features セクションの 3 つのブロックの背景・見出し・番号の色が `feature` / `brand` トークンに置き換わっている
- [ ] ダークモードで色が沈みすぎたり、コントラスト不足になったりしていないことを確認
- [ ] Tailwind の `blue-500` 等のアドホックカラーが該当箇所から一掃されている
