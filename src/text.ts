// Some hosts render accessory text without truncating it, so a long
// description pushes the title and subtitle out of the row.

const ELLIPSIS = "…";

// East Asian wide characters take two columns.
function charWidth(ch: string): number {
  const cp = ch.codePointAt(0) ?? 0;
  return (cp >= 0x1100 && cp <= 0x115f) ||
    (cp >= 0x2e80 && cp <= 0xa4cf) ||
    (cp >= 0xac00 && cp <= 0xd7a3) ||
    (cp >= 0xf900 && cp <= 0xfaff) ||
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) ||
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff) ||
    (cp >= 0x20000 && cp <= 0x3fffd)
    ? 2
    : 1;
}

export function truncateToWidth(text: string, maxWidth: number): string {
  const chars = Array.from(text);
  let width = 0;
  for (const ch of chars) width += charWidth(ch);
  if (width <= maxWidth) return text;

  let out = "";
  width = 0;
  for (const ch of chars) {
    const w = charWidth(ch);
    if (width + w > maxWidth - 1) break;
    out += ch;
    width += w;
  }
  return out.trimEnd() + ELLIPSIS;
}
