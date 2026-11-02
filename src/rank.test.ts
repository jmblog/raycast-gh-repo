import { describe, it, expect } from "vitest";
import { rankRepositories } from "./rank";
import type { Repository } from "./gh";

const repo = (nameWithOwner: string): Repository => ({
  name: nameWithOwner.split("/")[1],
  nameWithOwner,
  description: "",
  url: `https://github.com/${nameWithOwner}`,
});

const names = (repos: Repository[]) => repos.map((r) => r.nameWithOwner);

describe("rankRepositories", () => {
  const repos = [
    repo("acme/notes-api"),
    repo("acme/stars"),
    repo("acme/tars"),
    repo("acme/tars-api"),
    repo("acme/the-arts"),
    repo("other/tools"),
  ];

  it("returns the input order unchanged for a blank query", () => {
    expect(names(rankRepositories(repos, "  "))).toEqual(names(repos));
  });

  it("puts an exact name match above subsequence matches", () => {
    expect(names(rankRepositories(repos, "tars"))).toEqual([
      "acme/tars", // exact
      "acme/tars-api", // prefix
      "acme/stars", // substring
      "acme/the-arts", // subsequence
    ]);
  });

  it("is case-insensitive", () => {
    expect(names(rankRepositories(repos, "TARS"))[0]).toBe("acme/tars");
  });

  it("ranks a word-start match above a mid-word substring", () => {
    expect(names(rankRepositories(repos, "api"))).toEqual([
      "acme/notes-api",
      "acme/tars-api",
    ]);
    expect(
      names(rankRepositories([repo("x/rapid"), repo("x/my-api")], "api")),
    ).toEqual(["x/my-api", "x/rapid"]);
  });

  it("matches the owner part via nameWithOwner, below name matches", () => {
    expect(
      names(rankRepositories([repo("other/x"), repo("y/other-x")], "other")),
    ).toEqual(["y/other-x", "other/x"]);
    expect(names(rankRepositories(repos, "other/"))).toEqual(["other/tools"]);
  });

  it("drops repositories that do not match", () => {
    expect(rankRepositories(repos, "zzz")).toEqual([]);
  });

  it("requires every whitespace-separated token to match", () => {
    expect(names(rankRepositories(repos, "acme api"))).toEqual([
      "acme/notes-api",
      "acme/tars-api",
    ]);
    expect(rankRepositories(repos, "tars zzz")).toEqual([]);
  });

  it("keeps the input order within the same tier", () => {
    const input = [repo("b/tars-z"), repo("a/tars-a")];
    expect(names(rankRepositories(input, "tars"))).toEqual(names(input));
  });
});
