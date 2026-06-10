/** Split the `orgs` preference string into a clean list of orgs/users. */
export function parseOrgs(input: string): string[] {
  return input
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
