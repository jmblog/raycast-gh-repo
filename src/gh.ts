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
