# gh-repo Raycast 拡張 設計ドキュメント

作成日: 2026-06-10

## 概要

[hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo) の Raycast 版。
指定した GitHub の org / user のリポジトリ一覧をインクリメンタル検索し、選択したものをブラウザで開く（または URL をコピーする）。

## ゴール / 非ゴール

### ゴール
- 元の Alfred ワークフローと同等の体験を Raycast で提供する
- 個人利用向け（ローカル開発拡張として登録、Raycast Store には公開しない）
- 複数 org/user に対応

### 非ゴール
- スター数・主言語・アーカイブ状態などのメタデータ表示（YAGNI）
- clone コマンドのコピー（YAGNI）
- GitHub OAuth / トークン管理（`gh` CLI の認証に委ねる）

## アーキテクチャ

Raycast 拡張の標準構成。

- 言語 / ランタイム: TypeScript + React + `@raycast/api` + `@raycast/utils`
- コマンド: 1 つ（`search-repositories`、`view` モード）
- 配置先: `~/Projects/jmblog/raycast-gh-repo`
- 配布: ローカル開発拡張（`ray develop` で登録）。Store 公開はしない。

### コンポーネント構成

| ユニット | 役割 | 依存 |
|---|---|---|
| `search-repositories.tsx` | エントリポイント。`<List>` を描画し、検索・アクションを束ねる | `useRepositories`, `@raycast/api` |
| `useRepositories` (hook) | `gh` を `execFile` で実行してリポジトリ配列を返す。`useCachedPromise` で stale-while-revalidate | `gh` CLI, `@raycast/utils` |
| 設定 (Preferences) | `orgs` 文字列を受け取る | `package.json` の `preferences` |

各ユニットは独立してテスト・理解できる粒度に保つ。`gh` 呼び出しとパース処理は hook に閉じ込め、UI コンポーネントはデータ配列だけを受け取る。

## データ取得

- `gh` コマンドの実行は `child_process.execFile`（`util.promisify` でラップ）で行い、それを `useCachedPromise` に渡してキャッシュ・再取得を任せる（`useExec` は永続キャッシュを持たないため、キャッシュ方針と整合する `useCachedPromise` に一本化する）:

  ```
  gh repo list <org> --limit 1000 --no-archived \
    --json name,nameWithOwner,description,url
  ```

- `orgs` 設定をスペースまたはカンマで分割し、org ごとに実行して結果をマージする。
- Raycast はスクリプトを最小 PATH で起動するため、`gh` を確実に見つけられるよう実行時に `PATH` へ `/opt/homebrew/bin:/usr/local/bin` を補う（元版と同じ対応）。
- 取得結果の型:

  ```ts
  type Repository = {
    name: string;            // title 用
    nameWithOwner: string;   // subtitle / keywords 用
    description: string;     // subtitle 補足
    url: string;             // アクション用
  };
  ```

## 設定（Raycast Preferences）

| キー | 型 | 必須 | 説明 |
|---|---|---|---|
| `orgs` | text | はい | 対象の org / user。スペースまたはカンマ区切りで複数指定可。元版の `ORG` 相当。 |

TTL 設定は持たない（下記キャッシュ方針を参照）。

## 検索・表示

- 取得した全リポジトリを `<List>` に流し込み、**フィルタリングは Raycast 標準のファジー検索に委ねる**（元版が手書きしていた substring grep は不要）。
- 各 `<List.Item>`:
  - `title`: リポジトリ名（`name`）
  - `subtitle`: `nameWithOwner`（`description` があれば併記）
  - `keywords`: `[nameWithOwner]`（owner/name どちらでもヒットさせる）
- 単一 org か複数 org かに関わらず、subtitle に `nameWithOwner` を出すことで識別可能にする。

## アクション

`<ActionPanel>` に以下を割り当てる。

- Enter: `Action.OpenInBrowser`（`repo.url`）— 既定アクション
- Cmd+Enter: `Action.CopyToClipboard`（`repo.url`）

## キャッシュ

- `useCachedPromise`（`@raycast/utils`）による **stale-while-revalidate**:
  - 前回のキャッシュを即座に表示し、裏で `gh` を再実行して最新化する。
  - 結果として「即表示 + 自動更新」となり、元版の TTL + バックグラウンド更新の意図をより少ないコードで満たす。
- TTL 管理コードは持たない。`gh` 呼び出しは軽量で、バックグラウンド更新はノンブロッキングのため毎回更新で問題ない。

## エラー処理

元版の `err`（`valid:false` アイテム表示）に相当する挙動を Raycast で再現する。

- `orgs` 未設定: `<List.EmptyView>` で「orgs を設定してください」と案内（Raycast は必須 Preference 未入力時に設定画面を促すため、基本的にここには到達しにくい）。
- `gh` 未インストール / 未認証 / 取得失敗: `useCachedPromise` の `error` を捕捉し、Toast（`showFailureToast`）と `<List.EmptyView>` でメッセージ表示。`gh auth status` の案内を含める。
- 一致なし: Raycast 標準の「No results」表示に委ねる。

## テスト

- `gh` 出力（JSON）→ `Repository[]` へのパース関数を純関数として切り出し、ユニットテストする。
- `orgs` 文字列の分割（スペース / カンマ混在、空要素除去）を純関数として切り出し、ユニットテストする。
- UI の手動確認: 単一 org / 複数 org / 未認証時のフォールバックを `ray develop` で確認する。

## 元版との差分まとめ

| 項目 | Alfred 版 | Raycast 版 |
|---|---|---|
| フィルタ | スクリプト内 substring grep | Raycast 標準ファジー検索 |
| キャッシュ | JSONL + TTL + 手動バックグラウンド更新 | `useCachedPromise`（stale-while-revalidate） |
| 設定 | `ORG`, `CACHE_TTL` 環境変数 | `orgs` Preference のみ |
| アクション | ブラウザで開く | ブラウザで開く + URL コピー |
