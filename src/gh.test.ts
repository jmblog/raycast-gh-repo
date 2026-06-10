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
