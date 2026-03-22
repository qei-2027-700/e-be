# Issue #64: feat: ユーザー側の画像アップロード機能の実装、検討

## 背景

イベント主催者がイベントイメージ用の画像をアップロードし、イベント詳細画面に表示させたい。
現在の `events` テーブルには `banner_image_url` カラムが存在しない。
`docs/features/event-creation.md` には「バナー画像（任意・jpg/png/webp・最大5MB）」として入力項目が定義されているが、未実装。

## 参照

- GitHub Issue: #64
- 関連ドキュメント: `docs/features/event-creation.md`（バナー画像入力項目）

## 実装方針

- ストレージは **Vercel Blob**（`@vercel/blob`）を使用する
  - 理由：Vercel ネイティブで環境変数の自動プロビジョニングが可能、最大 5TB
- アップロードは **クライアントサイドから Vercel Blob の `put()` を直接呼び出す方式**（client upload）を採用する
  - Route Handler でアップロードを中継するとファイルが Server メモリを通過するため、大きいファイルに不向き
  - Vercel Blob の `upload()` + クライアント SDK を使うか、または Server Action 経由でプリサインURLを取得してから直接 PUT する方式を選ぶ
  - **実装方式要確認**: Issue に記載なし。シンプルさ優先なら Server Action で `put()` を呼んでも 5MB 程度なら問題ない。まずはこちらを採用し、パフォーマンス要件が出たらクライアント直接アップロードに切り替える
- DB には URL のみを保存する（バイナリは持たない）
- 既存の `updateEventDraft` Server Action に画像 URL 更新を統合する

## 実装ステップ

1. **Vercel Blob のセットアップ**
   - `pnpm add @vercel/blob --filter=web` でインストール
   - `BLOB_READ_WRITE_TOKEN` 環境変数を確認（Vercel ダッシュボードで Blob ストアを作成してから `vercel env pull` で取得）
   - ローカル開発用に `.env.local` に `BLOB_READ_WRITE_TOKEN` を設定

2. **DB スキーマ変更**
   - `packages/db/src/schema.ts` の `events` テーブルに `bannerImageUrl: text('banner_image_url')` カラムを追加
   - マイグレーションを生成・適用: `pnpm db:generate` → `pnpm db:migrate`

3. **画像アップロード Server Action の作成**
   - `apps/web/src/lib/actions/event.ts` に `uploadEventBannerImage(eventId, formData)` を追加
   - 処理フロー:
     1. 認証・認可チェック（イベントオーナーのみ）
     2. `formData.get('file')` で File を取得
     3. ファイルバリデーション（type: jpg/png/webp、size: ≤5MB）
     4. `@vercel/blob` の `put()` でアップロード
     5. 返ってきた URL を `events` テーブルの `bannerImageUrl` に保存
     6. 成功 or エラー結果を返す

4. **フォーム UI の実装**
   - `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` に画像アップロード UI を追加
   - コンポーネント構成:
     - ファイル input（`accept="image/jpeg,image/png,image/webp"`）
     - 現在のバナー画像プレビュー（設定済みの場合）
     - アップロードボタン or フォーム保存時にまとめてアップロード
   - **方式**: 「保存」ボタン押下時に画像を一緒にアップロードする（2ステップ不要でシンプル）
     - `updateEventDraft` 呼び出し前に `uploadEventBannerImage` を呼ぶか、`updateEventDraft` 内に統合する

5. **イベント詳細ページへの表示追加**
   - `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` にバナー画像を表示
   - `next/image` を使って最適化（`alt` テキストはイベントタイトル）
   - 未設定時はプレースホルダーまたは非表示

6. **型・クエリの更新**
   - `apps/web/src/lib/events.ts`（または関連クエリファイル）で `bannerImageUrl` を SELECT に含める
   - EventData 型に `bannerImageUrl: string | null` を追加

7. **i18n 対応**
   - 翻訳キーを追加（`event_edit.field_banner_image`、バリデーションエラー等）
   - 翻訳ファイルの全ロケールに追記

8. **Playwright で動作確認**
   - バナー画像アップロード → 保存 → 詳細ページで表示されることを確認

## 影響範囲

- `packages/db/src/schema.ts` — `events` テーブルに `bannerImageUrl` 追加
- `packages/db/` — マイグレーションファイル
- `apps/web/src/lib/actions/event.ts` — `uploadEventBannerImage` 追加 or `updateEventDraft` 拡張
- `apps/web/src/lib/events.ts` — クエリに `bannerImageUrl` 追加
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/edit/event-edit-form.tsx` — 画像アップロード UI
- `apps/web/src/app/[locale]/dashboard/event/[eventId]/page.tsx` — バナー表示
- 翻訳ファイル（`apps/web/src/messages/`）
- `apps/web/package.json` — `@vercel/blob` 追加

## 確認事項（TBD）

- **Vercel Blob ストアのセットアップ状況**: `BLOB_READ_WRITE_TOKEN` が未設定の場合、先にダッシュボードで Blob ストアを作成する必要がある
- **アップロードタイミング**: 「保存と同時」か「画像選択直後に即時アップロード」か（Issue に記載なし。「保存と同時」を採用する）
- **既存画像の削除**: バナー画像を差し替えたとき、旧 Blob URL を削除するか（Issue に記載なし。まずは削除しない方針で実装、後から対応）
- **画像リサイズ**: サーバーサイドでリサイズするか否か（Issue に記載なし。まずは `next/image` の自動最適化に任せる）
- **バナー画像の表示場所**: イベント詳細ページのみか、イベント一覧カードにも表示するか（Issue に記載なし。詳細ページのみで実装）

## チェックリスト

- [ ] `@vercel/blob` インストール済み
- [ ] `BLOB_READ_WRITE_TOKEN` 環境変数が設定されている
- [ ] `events` テーブルに `banner_image_url` カラム追加・マイグレーション適用
- [ ] Server Action でのアップロード・URL保存が動作する
- [ ] バリデーション（ファイル種別・サイズ）が機能する
- [ ] イベント編集フォームに画像アップロード UI が表示される
- [ ] 既存バナー画像のプレビューが表示される
- [ ] イベント詳細ページにバナー画像が表示される（`next/image` 使用）
- [ ] i18n 翻訳キーが全ロケール追加済み
- [ ] Playwright で画像アップロード〜表示まで動作確認済み
