import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

// Raycast launches scripts with a minimal PATH; augment it so `gh` is found.
const GH_PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}`;

export type Repository = {
  name: string;
  nameWithOwner: string;
  description: string;
  url: string;
};

/** Parse the JSON array printed by `gh repo list --json ...`. */
export function parseRepoList(json: string): Repository[] {
  const raw = JSON.parse(json) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected gh output: expected a JSON array of repositories");
  }
  return (raw as Array<{
    name: string;
    nameWithOwner: string;
    description: string | null;
    url: string;
  }>).map((r) => ({
    name: r.name,
    nameWithOwner: r.nameWithOwner,
    description: r.description ?? "",
    url: r.url,
  }));
}

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
