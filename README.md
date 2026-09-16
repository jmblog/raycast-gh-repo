English | [日本語](README.ja.md)

# GitHub Repo Search (Raycast)

A Raycast port of [hokaccha/alfred-workflow-gh-repo](https://github.com/hokaccha/alfred-workflow-gh-repo).
Search the repositories of configured GitHub orgs/users and open them in the browser or copy their URL.

## Requirements

- [Raycast](https://raycast.com/) or [Tinycast](https://abue-ammar.github.io/tinycast/)
- [GitHub CLI](https://cli.github.com/) (`brew install gh`) — sign in with `gh auth login`

## Setup

```bash
npm install
# register as a local development extension in Raycast
npm run dev
# or register in Tinycast
npm run dev:tinycast
```

> Once you run `npm run dev`, the extension is installed into Raycast and stays there even after you stop it with `Ctrl+C`. For everyday use: run `npm run dev` once to register, stop it with `Ctrl+C`, and keep using it as is. Run `npm run dev` again only when you change the code — it enables hot reload.

In the extension preferences, set **Orgs / Users** to the orgs/users you want to list (separate multiple entries with spaces or commas).

### Tinycast

[Tinycast](https://github.com/abue-ammar/tinycast) runs Raycast extensions from `~/Library/Application Support/com.tinycast.app/extensions/`. It does not support `ray develop`, so the extension is built straight into that directory instead:

```bash
npm run build:tinycast   # build once into Tinycast's extensions directory
npm run dev:tinycast     # rebuild whenever src/ or package.json changes
```

Tinycast only scans for new extensions on launch, so restart Tinycast after the first build. Subsequent rebuilds overwrite the installed files in place.

Set `TINYCAST_EXTENSIONS_DIR` to override the target directory (for example, for a debug build of Tinycast with a different bundle id).

## Usage

- Open "Search Repositories" in Raycast to see the repository list
- Filter by name or `owner/name` (Raycast's built-in fuzzy search)
- Enter: open in the browser
- Cmd+Enter: copy the URL

Repositories are listed alphabetically by name (typing a query lets Raycast reorder them by match score).

## How it works

- Fetches via `gh repo list <org> --no-archived --json name,nameWithOwner,description,url`
- Uses `useCachedPromise` (stale-while-revalidate) to show cached data instantly while refreshing in the background

## Development

```bash
npm test      # unit tests (vitest)
npm run lint  # lint (ray lint)
npm run build # build (ray build) into Raycast's extensions directory
npm run build:tinycast # build into Tinycast's extensions directory
```
