# gh-repo Raycast 拡張 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 指定した GitHub org/user のリポジトリ一覧をインクリメンタル検索し、ブラウザで開く / URL をコピーする Raycast 拡張を作る（[hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo) の Raycast 版）。

**Architecture:** TypeScript + React + `@raycast/api` の単一 `view` コマンド。`gh repo list` を `execFile` で実行し、`@raycast/utils` の `useCachedPromise`（stale-while-revalidate）で結果をキャッシュ。フィルタは Raycast 標準のファジー検索に委ねる。純粋関数（orgs 文字列の分割・gh JSON のパース）は Raycast に依存しないモジュールに分離し vitest でユニットテストする。

**Tech Stack:** TypeScript 5, React 18, `@raycast/api`, `@raycast/utils`, vitest, GitHub CLI (`gh`)

**前提:** 開発マシンに Raycast アプリと `gh` CLI がインストール済みで、`gh auth login` 済みであること。

**ディレクトリ構成（作成後）:**

```
raycast-gh-repo/
├── package.json              # Raycast manifest + 依存 + scripts
├── tsconfig.json
├── .eslintrc.json
├── .gitignore
├── assets/
│   └── icon.png              # コマンドアイコン (512x512)
├── src/
│   ├── search-repositories.tsx  # コマンド本体 (UI)
│   ├── orgs.ts                  # orgs 文字列の分割（純粋関数）
│   ├── orgs.test.ts
│   ├── gh.ts                    # gh 実行 + JSON パース
│   └── gh.test.ts
└── docs/superpowers/...
```

責務の分離: `orgs.ts` と `gh.ts` は `@raycast/api` を import しない（node 環境で素直にテストできるようにするため）。UI を持つ `search-repositories.tsx` だけが Raycast API に依存する。

---

### Task 1: プロジェクトの足場を作る

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.eslintrc.json`
- Create: `.gitignore`
- Create: `assets/icon.png`
- Create: `src/search-repositories.tsx`（最小プレースホルダ）

- [ ] **Step 1: `package.json` を作成**

```json
{
  "$schema": "https://www.raycast.com/schemas/extension.json",
  "name": "gh-repo",
  "title": "GitHub Repo Search",
  "description": "Search repositories of given GitHub orgs/users and open them in the browser.",
  "icon": "icon.png",
  "author": "jmblog",
  "categories": ["Developer Tools"],
  "license": "MIT",
  "commands": [
    {
      "name": "search-repositories",
      "title": "Search Repositories",
      "description": "Search repositories of the configured orgs/users",
      "mode": "view"
    }
  ],
  "preferences": [
    {
      "name": "orgs",
      "title": "Orgs / Users",
      "description": "GitHub orgs or users to list repositories for. Separate multiple with spaces or commas.",
      "type": "textfield",
      "required": true,
      "placeholder": "octocat my-org another-user"
    }
  ],
  "dependencies": {
    "@raycast/api": "^1.70.0",
    "@raycast/utils": "^1.13.0"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^1.0.6",
    "@types/node": "^20.8.10",
    "@types/react": "^18.2.27",
    "eslint": "^8.51.0",
    "prettier": "^3.0.3",
    "typescript": "^5.2.2",
    "vitest": "^1.2.0"
  },
  "scripts": {
    "build": "ray build -e dist",
    "dev": "ray develop",
    "lint": "ray lint",
    "fix-lint": "ray lint --fix",
    "test": "vitest run"
  }
}
```

- [ ] **Step 2: `tsconfig.json` を作成**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "include": ["src/**/*"],
  "compilerOptions": {
    "lib": ["ES2023"],
    "module": "commonjs",
    "target": "ES2022",
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true
  }
}
```

- [ ] **Step 3: `.eslintrc.json` を作成**

```json
{
  "root": true,
  "extends": ["@raycast"]
}
```

- [ ] **Step 4: `.gitignore` を作成**

```
node_modules
dist
.DS_Store
raycast-env.d.ts
*.log
```

- [ ] **Step 5: アイコンを用意（元リポジトリの icon.png を再利用）**

```bash
mkdir -p assets
gh api repos/hokaccha/alfred-workflow-gh-repo/contents/icon.png --jq '.content' | base64 -d > assets/icon.png
```

確認: `file assets/icon.png` が `PNG image data` を返すこと。

- [ ] **Step 6: 最小のコマンドファイルを作成**（足場が通ることを確認するためのプレースホルダ。Task 5 で本実装に差し替える）

`src/search-repositories.tsx`:

```tsx
import { List } from "@raycast/api";

export default function Command() {
  return <List />;
}
```

- [ ] **Step 7: 依存をインストール**

Run: `npm install`
Expected: エラーなく `node_modules` が作成される。

- [ ] **Step 8: ビルドが通ることを確認**

Run: `npm run build`
Expected: `ray build` が成功し `dist/` が生成される（型エラーなし）。

- [ ] **Step 9: コミット**

```bash
git add package.json tsconfig.json .eslintrc.json .gitignore assets/icon.png src/search-repositories.tsx package-lock.json
git commit -m "chore: scaffold gh-repo Raycast extension"
```

---

### Task 2: orgs 文字列の分割（`parseOrgs`）

**Files:**
- Create: `src/orgs.ts`
- Test: `src/orgs.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/orgs.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseOrgs } from "./orgs";

describe("parseOrgs", () => {
  it("splits on spaces", () => {
    expect(parseOrgs("foo bar")).toEqual(["foo", "bar"]);
  });

  it("splits on commas", () => {
    expect(parseOrgs("foo,bar")).toEqual(["foo", "bar"]);
  });

  it("handles mixed separators and extra whitespace", () => {
    expect(parseOrgs(" foo,  bar baz ,qux ")).toEqual(["foo", "bar", "baz", "qux"]);
  });

  it("returns an empty array for a blank string", () => {
    expect(parseOrgs("   ")).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL（`./orgs` が存在しない / `parseOrgs is not a function`）。

- [ ] **Step 3: 最小実装を書く**

`src/orgs.ts`:

```ts
/** Split the `orgs` preference string into a clean list of orgs/users. */
export function parseOrgs(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test`
Expected: PASS（4 件）。

- [ ] **Step 5: コミット**

```bash
git add src/orgs.ts src/orgs.test.ts
git commit -m "feat: add parseOrgs for splitting the orgs preference"
```

---

### Task 3: gh JSON のパース（`Repository` 型 + `parseRepoList`）

**Files:**
- Create: `src/gh.ts`
- Test: `src/gh.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`src/gh.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseRepoList } from "./gh";

describe("parseRepoList", () => {
  it("maps gh JSON to Repository objects", () => {
    const json = JSON.stringify([
      {
        name: "repo1",
        nameWithOwner: "octocat/repo1",
        description: "first",
        url: "https://github.com/octocat/repo1",
      },
    ]);
    expect(parseRepoList(json)).toEqual([
      {
        name: "repo1",
        nameWithOwner: "octocat/repo1",
        description: "first",
        url: "https://github.com/octocat/repo1",
      },
    ]);
  });

  it("normalizes null description to an empty string", () => {
    const json = JSON.stringify([
      {
        name: "repo2",
        nameWithOwner: "octocat/repo2",
        description: null,
        url: "https://github.com/octocat/repo2",
      },
    ]);
    expect(parseRepoList(json)[0].description).toBe("");
  });

  it("returns an empty array for an empty list", () => {
    expect(parseRepoList("[]")).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm test`
Expected: FAIL（`./gh` が存在しない / `parseRepoList is not a function`）。

- [ ] **Step 3: 最小実装を書く**

`src/gh.ts`:

```ts
export type Repository = {
  name: string;
  nameWithOwner: string;
  description: string;
  url: string;
};

/** Parse the JSON array printed by `gh repo list --json ...`. */
export function parseRepoList(json: string): Repository[] {
  const raw = JSON.parse(json) as Array<{
    name: string;
    nameWithOwner: string;
    description: string | null;
    url: string;
  }>;
  return raw.map((r) => ({
    name: r.name,
    nameWithOwner: r.nameWithOwner,
    description: r.description ?? "",
    url: r.url,
  }));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm test`
Expected: PASS（Task 2 の 4 件 + 本タスクの 3 件 = 7 件）。

- [ ] **Step 5: コミット**

```bash
git add src/gh.ts src/gh.test.ts
git commit -m "feat: add Repository type and parseRepoList"
```

---

### Task 4: gh の実行とマージ（`fetchRepositories`）

**Files:**
- Modify: `src/gh.ts`（`parseRepoList` の下に追記）

> 注: `fetchRepositories` は `gh` プロセスを起動するため自動ユニットテストは行わない（Task 5 完了後に `npm run dev` で手動確認する）。実装は `parseRepoList` を再利用する。

- [ ] **Step 1: `src/gh.ts` の先頭に import を追加**

ファイル先頭（`export type Repository` の前）に追加:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Raycast launches scripts with a minimal PATH; augment it so `gh` is found.
const GH_PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}`;
```

- [ ] **Step 2: `fetchRepositories` を `src/gh.ts` の末尾に追記**

```ts
/** Run `gh repo list` for each org/user and return the merged repository list. */
export async function fetchRepositories(orgs: string[]): Promise<Repository[]> {
  const results = await Promise.all(
    orgs.map(async (org) => {
      const { stdout } = await execFileAsync(
        "gh",
        [
          "repo",
          "list",
          org,
          "--limit",
          "1000",
          "--no-archived",
          "--json",
          "name,nameWithOwner,description,url",
        ],
        { env: { ...process.env, PATH: GH_PATH }, maxBuffer: 10 * 1024 * 1024 },
      );
      return parseRepoList(stdout);
    }),
  );
  return results.flat();
}
```

- [ ] **Step 3: 型チェック（既存テストが壊れていないことも確認）**

Run: `npm test`
Expected: PASS（7 件のまま。`fetchRepositories` 自体のテストは無いが、import 追加でパースのテストが壊れていないことを確認）。

- [ ] **Step 4: コミット**

```bash
git add src/gh.ts
git commit -m "feat: add fetchRepositories to run and merge gh repo list"
```

---

### Task 5: コマンド UI を実装

**Files:**
- Modify: `src/search-repositories.tsx`（Task 1 のプレースホルダを全置換）

- [ ] **Step 1: コマンド本体を実装**

`src/search-repositories.tsx` の内容を以下で全置換:

```tsx
import { ActionPanel, Action, List, getPreferenceValues } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { parseOrgs } from "./orgs";
import { fetchRepositories } from "./gh";

export default function Command() {
  const { orgs } = getPreferenceValues<{ orgs: string }>();

  const { data, isLoading, error } = useCachedPromise(
    (orgsString: string) => fetchRepositories(parseOrgs(orgsString)),
    [orgs],
    { initialData: [] },
  );

  return (
    <List isLoading={isLoading}>
      {error ? (
        <List.EmptyView
          title="Failed to fetch repositories"
          description={`Check the Orgs / Users setting and run: gh auth status\n\n${error.message}`}
        />
      ) : (
        data.map((repo) => (
          <List.Item
            key={repo.nameWithOwner}
            title={repo.name}
            subtitle={
              repo.description ? `${repo.nameWithOwner} — ${repo.description}` : repo.nameWithOwner
            }
            keywords={[repo.nameWithOwner]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser url={repo.url} />
                <Action.CopyToClipboard
                  title="Copy URL"
                  content={repo.url}
                  shortcut={{ modifiers: ["cmd"], key: "enter" }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
```

- [ ] **Step 2: ビルド（型チェック）が通ることを確認**

Run: `npm run build`
Expected: `ray build` 成功（型エラーなし）。

- [ ] **Step 3: Lint が通ることを確認**

Run: `npm run lint`
Expected: lint エラーなし（警告のみなら可。エラーがあれば `npm run fix-lint` で修正）。

- [ ] **Step 4: 手動確認**

1. `npm run dev` を実行（Raycast に開発拡張として登録され、`raycast-env.d.ts` が生成される）。
2. Raycast の拡張設定で **Orgs / Users** に自分が確認できる org/user を 1 つ設定する。
3. Raycast で「Search Repositories」を開き、以下を確認:
   - リポジトリ一覧が表示される（初回は読み込み、2 回目以降は即表示 + 裏で更新）。
   - 検索ボックスに名前 / owner を入れるとファジー絞り込みできる。
   - Enter でブラウザが開く。Cmd+Enter で URL がコピーされる。
4. Orgs を複数（スペース / カンマ区切り）にして、両方のリポジトリがマージ表示されることを確認。
5. （任意）`gh auth logout` 等で未認証状態にし、エラー時に EmptyView と失敗トーストが出ることを確認（確認後 `gh auth login` で戻す）。

- [ ] **Step 5: コミット**

```bash
git add src/search-repositories.tsx
git commit -m "feat: implement Search Repositories command UI"
```

---

### Task 6: README と仕上げ

**Files:**
- Create: `README.md`

- [ ] **Step 1: `README.md` を作成**

```markdown
# GitHub Repo Search (Raycast)

[hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo) の Raycast 版。
設定した GitHub の org / user のリポジトリ一覧を検索し、ブラウザで開く / URL をコピーする。

## 必要なもの

- [Raycast](https://raycast.com/)
- [GitHub CLI](https://cli.github.com/)（`brew install gh`）— `gh auth login` で認証済みにしておく

## セットアップ

\`\`\`bash
npm install
npm run dev   # ローカル開発拡張として Raycast に登録
\`\`\`

Raycast の拡張設定で **Orgs / Users** に対象の org/user を入力する（スペースまたはカンマ区切りで複数可）。

## 使い方

- Raycast で「Search Repositories」を開くとリポジトリ一覧が出る
- 名前 / `owner/name` で絞り込み
- Enter: ブラウザで開く
- Cmd+Enter: URL をコピー

## 仕組み

- `gh repo list <org> --no-archived --json ...` で取得
- `useCachedPromise`（stale-while-revalidate）でキャッシュを即表示しつつ裏で更新
\`\`\`

- [ ] **Step 2: 全テストが通ることを最終確認**

Run: `npm test`
Expected: PASS（7 件）。

- [ ] **Step 3: コミット**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## 完了条件

- [ ] `npm test` が緑（parseOrgs / parseRepoList）
- [ ] `npm run build` が成功
- [ ] `npm run dev` で登録後、単一 org / 複数 org でリポジトリ一覧が表示され検索できる
- [ ] Enter でブラウザが開き、Cmd+Enter で URL がコピーされる
- [ ] 未認証 / 取得失敗時にエラー表示される
