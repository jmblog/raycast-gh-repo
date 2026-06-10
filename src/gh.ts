import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);


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

/**
 * Run `gh repo list` for each org/user and return the merged repository list.
 * Note: capped at 1000 repos per org (gh's `--limit`); larger orgs are truncated.
 */
export async function fetchRepositories(orgs: string[]): Promise<Repository[]> {
  // Raycast launches scripts with a minimal PATH; augment it so `gh` is found.
  const env = { ...process.env, PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ""}` };
  const results = await Promise.all(
    orgs.map(async (org) => {
      try {
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
          { env, maxBuffer: 10 * 1024 * 1024 },
        );
        return parseRepoList(stdout);
      } catch (error) {
        const stderr = (error as { stderr?: string }).stderr?.trim();
        const message = stderr || (error as Error).message;
        throw new Error(`gh repo list failed for "${org}": ${message}`);
      }
    }),
  );
  return results.flat();
}
