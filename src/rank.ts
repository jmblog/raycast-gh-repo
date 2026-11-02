import type { Repository } from "./gh";

// Lower is better. A token that matches none of these drops the repository.
const EXACT = 0;
const PREFIX = 1;
const WORD_START = 2;
const SUBSTRING = 3;
const OWNER_SUBSTRING = 4;
const SUBSEQUENCE = 5;
const OWNER_SUBSEQUENCE = 6;

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

function tokenTier(
  token: string,
  name: string,
  full: string,
): number | undefined {
  if (name === token) return EXACT;
  if (name.startsWith(token)) return PREFIX;
  const at = name.indexOf(token);
  if (at !== -1) {
    // A hit right after a separator ("api" in "notes-api") reads as a word match.
    for (let i = at; i !== -1; i = name.indexOf(token, i + 1)) {
      if (/[-_.]/.test(name[i - 1])) return WORD_START;
    }
    return SUBSTRING;
  }
  if (full.includes(token)) return OWNER_SUBSTRING;
  if (isSubsequence(token, name)) return SUBSEQUENCE;
  if (isSubsequence(token, full)) return OWNER_SUBSEQUENCE;
  return undefined;
}

/**
 * Filter and order repositories for a search query, best match first.
 * Every whitespace-separated token must match; a repository ranks by its
 * weakest token. Ties keep the input order.
 */
export function rankRepositories(
  repos: Repository[],
  query: string,
): Repository[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return repos;

  const scored: { repo: Repository; tier: number }[] = [];
  for (const repo of repos) {
    const name = repo.name.toLowerCase();
    const full = repo.nameWithOwner.toLowerCase();
    let worst = EXACT;
    let matched = true;
    for (const token of tokens) {
      const tier = tokenTier(token, name, full);
      if (tier === undefined) {
        matched = false;
        break;
      }
      worst = Math.max(worst, tier);
    }
    if (matched) scored.push({ repo, tier: worst });
  }
  // Array.prototype.sort is stable, so equal tiers keep the input order.
  return scored.sort((a, b) => a.tier - b.tier).map((s) => s.repo);
}
