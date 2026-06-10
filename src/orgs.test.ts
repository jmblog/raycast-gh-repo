import { describe, it, expect } from "vitest";
import { parseOrgs } from "./orgs";

describe("parseOrgs", () => {
  it("splits on spaces", () => {
    expect(parseOrgs("foo bar")).toEqual(["foo", "bar"]);
  });

  it("splits on commas", () => {
    expect(parseOrgs("foo,bar")).toEqual(["foo", "bar"]);
  });

  it("handles mixed separators and extra whitespace", () => {
    expect(parseOrgs(" foo,  bar baz ,qux ")).toEqual(["foo", "bar", "baz", "qux"]);
  });

  it("returns an empty array for a blank string", () => {
    expect(parseOrgs("   ")).toEqual([]);
  });
});
