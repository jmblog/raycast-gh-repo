import { describe, it, expect } from "vitest";
import { truncateToWidth } from "./text";

describe("truncateToWidth", () => {
  it("keeps text that fits", () => {
    expect(truncateToWidth("short", 10)).toBe("short");
    expect(truncateToWidth("abcdefghij", 10)).toBe("abcdefghij");
  });

  it("truncates ASCII with an ellipsis within the width", () => {
    expect(truncateToWidth("abcdefghijk", 10)).toBe("abcdefghi…");
  });

  it("counts wide characters as two columns", () => {
    expect(truncateToWidth("あいうえおかきくけこ", 10)).toBe("あいうえ…");
  });

  it("does not leave trailing spaces before the ellipsis", () => {
    expect(truncateToWidth("abcd efghijk", 6)).toBe("abcd…");
  });
});
