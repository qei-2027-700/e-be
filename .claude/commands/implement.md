# /implement <issue番号>

指定した Issue のステアリングファイルを読み、実装・検証・PR作成までを自動で行う。

## 手順

1. `.claude/steering/issue-<番号>-*.md` を読む
2. 関連する `docs/features/*.md` を読む
3. `docs/architecture/decisions.md` を読む
4. フォームの実装が含まれる場合は `docs/architecture/validations.md` を読む
5. 実装する
5. `pnpm dev` が起動中でなければ起動し、Playwright MCP でスクリーンショットを取得して動作検証する
6. 問題なければ `git add` → `git commit` → `git push`
7. `gh pr create` で PR を作成する
8. PR の diff を読んでセルフレビューコメントを PR に投稿する

## 注意

- TBD に遭遇したら実装を止めてユーザーに確認する
- スクリーンショットで明らかにおかしい表示があれば自己修正してから commit する
- PR タイトルは Issue タイトルに合わせる
- commit メッセージは日本語でよい
