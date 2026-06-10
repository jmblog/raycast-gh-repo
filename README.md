# GitHub Repo Search (Raycast)

[hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo) の Raycast 版。
設定した GitHub の org / user のリポジトリ一覧を検索し、ブラウザで開く / URL をコピーする。

## 必要なもの

- [Raycast](https://raycast.com/)
- [GitHub CLI](https://cli.github.com/)（`brew install gh`）— `gh auth login` で認証済みにしておく

## セットアップ

```bash
npm install
npm run dev   # ローカル開発拡張として Raycast に登録
```

> `npm run dev` は一度起動すれば拡張が Raycast にインストールされ、`Ctrl+C` で停止しても残り続けます。普段使いでは「初回に一度 `npm run dev` で登録 → `Ctrl+C` で停止 → 以後はそのまま利用」で OK です。コードを変更するときだけ再度 `npm run dev` を起動するとホットリロードが効きます。

Raycast の拡張設定で **Orgs / Users** に対象の org/user を入力する（スペースまたはカンマ区切りで複数可）。

## 使い方

- Raycast で「Search Repositories」を開くとリポジトリ一覧が出る
- 名前 / `owner/name` で絞り込み（Raycast 標準のファジー検索）
- Enter: ブラウザで開く
- Cmd+Enter: URL をコピー

## 仕組み

- `gh repo list <org> --no-archived --json name,nameWithOwner,description,url` で取得
- `useCachedPromise`（stale-while-revalidate）でキャッシュを即表示しつつ裏で更新

## 開発

```bash
npm test      # ユニットテスト (vitest)
npm run lint  # Lint (ray lint)
npm run build # ビルド (ray build)
```
