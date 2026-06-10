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
