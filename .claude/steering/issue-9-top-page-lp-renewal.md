# Issue #9: トップページを本格的な LP に刷新する

## 背景

現在のトップページ（`apps/web/src/app/[locale]/page.tsx`）はヘッダー・ヒーロー・機能カード 6 枚・スタックバッジのみの最小構成。
E-be のターゲット（バーオーナー・イベンター）に向けた課題提起・価値提案・使い方フローを盛り込み、
コンバージョンを意識した本格的な LP にリニューアルする。

## 参照

- GitHub Issue: #9
- 関連ドキュメント:
  - `docs/features/index.md`（機能一覧）
  - `docs/features/bar-search.md`（バー検索機能）
  - `docs/features/event-search.md`（イベント検索機能）
  - `docs/architecture/decisions.md` #2（多言語設計）
  - `.claude/steering/i18n.md`（next-intl 設定・翻訳キー規則）

## 実装方針

- **Server Component のまま維持**。スクロール固定ヘッダーのみ `'use client'` を最小限に切り出す
- **画像・動画は使わない**。アイコン（絵文字）・Tailwind グラデーション・シェイプで視覚的に表現
- **shadcn/ui のコンポーネントを使う**（`Card`, `Badge`, `Button`, `Separator`）
- **モバイルファースト**。`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` を基本とする
- **CTA ボタンは現時点でダミーリンク（`href="#"`）**。機能実装後に差し替える
- **i18n 必須**。`en.json` と `ja.json` の両方に翻訳キーを追加する

## 実装ステップ

1. **翻訳キーを設計する**（実装前に ja/en の全キーを洗い出す）
   - 既存の `home.*` キーを拡張し、新セクション分を追加
   - キー構造: `home.nav.*`, `home.hero.*`, `home.pain.*`, `home.features.*`, `home.how.*`, `home.cta.*`, `home.footer.*`

2. **`apps/web/messages/ja.json` に翻訳キーを追加**

3. **`apps/web/messages/en.json` に翻訳キーを追加**

4. **`apps/web/src/app/[locale]/page.tsx` をリニューアル**
   以下のセクションを順番に実装する:

   | セクション | 実装内容 |
   |-----------|---------|
   | `<NavBar>` | ロゴ・サインイン・サインアップ。スクロール検知で背景をつける（`'use client'` の薄いラッパー） |
   | `<HeroSection>` | キャッチコピー・サブコピー・2つの CTA（「イベントを探す」「開催を申し込む」） |
   | `<PainSection>` | 「こんな悩みありませんか？」バーオーナー / イベンターの 2 カラム課題リスト |
   | `<FeaturesSection>` | 機能 6 件をアイコン付きカードで表示（既存を充実化） |
   | `<HowSection>` | 「登録 → 申請 → 開催」の 3 ステップ図解 |
   | `<CtaBanner>` | 「今すぐはじめる」大きめバナー |
   | `<Footer>` | コピーライト・リンク集（プライバシー・利用規約は `href="#"` のダミー） |

5. **Playwright MCP で動作確認**（`/pw-verify`）

## コンポーネント分割の指針

- セクションが長くなる場合は `apps/web/src/components/lp/` 以下に分割してもよい
- ただし各セクションが軽量であれば `page.tsx` に inline でも可
- スクロール固定ヘッダーのみ `'use client'` が必要なため、薄いラッパー `NavBar` を分割することを推奨

## 影響範囲

- `apps/web/src/app/[locale]/page.tsx` — 全面書き換え
- `apps/web/messages/ja.json` — `home.*` キー拡張
- `apps/web/messages/en.json` — `home.*` キー拡張
- （必要に応じて）`apps/web/src/components/lp/` 新規作成

## チェックリスト

- [ ] `ja.json` / `en.json` に全翻訳キーを追加した
- [ ] NavBar: ロゴ・サインイン・サインアップリンクが表示される
- [ ] NavBar: スクロール時に背景が現れる（`'use client'` の薄いラッパー）
- [ ] Hero: キャッチコピー・サブコピー・2つの CTA ボタンが表示される
- [ ] Pain: バーオーナー / イベンターの課題が 2 カラムで表示される
- [ ] Features: 機能 6 件がカードで表示される
- [ ] How: 3 ステップフローが表示される
- [ ] CtaBanner: 大きめバナーが表示される
- [ ] Footer: コピーライト・リンクが表示される
- [ ] モバイル（375px 幅）で崩れがない
- [ ] `/ja/` と `/en/` の両方で翻訳が表示される
- [ ] `'use client'` の使用は NavBar のみ（または最小限）
