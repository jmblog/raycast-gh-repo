import { describe, it, expect } from "vitest";
import { parseRepoList, sortRepositories, type Repository } from "./gh";

const repo = (name: string, nameWithOwner: string): Repository => ({
  name,
  nameWithOwner,
  description: "",
  url: `https://github.com/${nameWithOwner}`,
});

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

  it("throws when the payload is not an array", () => {
    expect(() => parseRepoList('{"not":"an array"}')).toThrow();
  });
});

describe("sortRepositories", () => {
  it("sorts by name case-insensitively", () => {
    const repos = [
      repo("Charlie", "octocat/Charlie"),
      repo("alpha", "octocat/alpha"),
      repo("Bravo", "octocat/Bravo"),
    ];
    expect(sortRepositories(repos).map((r) => r.name)).toEqual([
      "alpha",
      "Bravo",
      "Charlie",
    ]);
  });

  it("breaks ties on equal names by nameWithOwner", () => {
    const repos = [
      repo("api", "zeta/api"),
      repo("api", "alpha/api"),
    ];
    expect(sortRepositories(repos).map((r) => r.nameWithOwner)).toEqual([
      "alpha/api",
      "zeta/api",
    ]);
  });

  it("does not mutate the input array", () => {
    const repos = [repo("b", "o/b"), repo("a", "o/a")];
    sortRepositories(repos);
    expect(repos.map((r) => r.name)).toEqual(["b", "a"]);
  });
});
