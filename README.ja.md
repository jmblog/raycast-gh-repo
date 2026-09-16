[English](README.md) | 日本語

# GitHub Repo Search (Raycast)

[hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo) の Raycast 版。
設定した GitHub の org / user のリポジトリ一覧を検索し、ブラウザで開く / URL をコピーする。

## 必要なもの

- [Raycast](https://raycast.com/) または [Tinycast](https://abue-ammar.github.io/tinycast/)
- [GitHub CLI](https://cli.github.com/)（`brew install gh`）— `gh auth login` で認証済みにしておく

## セットアップ

```bash
npm install
# ローカル開発拡張として Raycast に登録
npm run dev   
# もしくは、Tinycast に登録
npm run dev:tinycast
```

> `npm run dev` は一度起動すれば拡張が Raycast にインストールされ、`Ctrl+C` で停止しても残り続けます。普段使いでは「初回に一度 `npm run dev` で登録 → `Ctrl+C` で停止 → 以後はそのまま利用」で OK です。コードを変更するときだけ再度 `npm run dev` を起動するとホットリロードが効きます。

Raycast の拡張設定で **Orgs / Users** に対象の org/user を入力する（スペースまたはカンマ区切りで複数可）。

### Tinycast

[Tinycast](https://github.com/abue-ammar/tinycast) は `~/Library/Application Support/com.tinycast.app/extensions/` にある Raycast 拡張を読み込む。`ray develop` には非対応なので、代わりにこのディレクトリへ直接ビルドする。

```bash
npm run build:tinycast   # Tinycast の拡張ディレクトリへ 1 回ビルド
npm run dev:tinycast     # src/ や package.json が変わるたびに再ビルド
```

Tinycast は起動時にしか新しい拡張を検出しないため、初回ビルド後は Tinycast を再起動する。以降の再ビルドはインストール済みのファイルをそのまま上書きする。

出力先を変えたい場合（bundle id が異なる Tinycast の Debug ビルドなど）は環境変数 `TINYCAST_EXTENSIONS_DIR` で指定できる。

## 使い方

- Raycast で「Search Repositories」を開くとリポジトリ一覧が出る
- 名前 / `owner/name` で絞り込み（Raycast 標準のファジー検索）
- Enter: ブラウザで開く
- Cmd+Enter: URL をコピー

リポジトリは名前のアルファベット順で表示される（検索文字を入力すると Raycast がマッチ度順に並べ替える）。

## 仕組み

- `gh repo list <org> --no-archived --json name,nameWithOwner,description,url` で取得
- `useCachedPromise`（stale-while-revalidate）でキャッシュを即表示しつつ裏で更新

## 開発

```bash
npm test      # ユニットテスト (vitest)
npm run lint  # Lint (ray lint)
npm run build # ビルド (ray build) → Raycast の拡張ディレクトリ
npm run build:tinycast # ビルド → Tinycast の拡張ディレクトリ
```
