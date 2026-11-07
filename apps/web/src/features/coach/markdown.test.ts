import { describe, expect, it } from "vitest";
import { parseCoachMarkdown } from "./markdown.ts";

const sample = [
  "If **today is November 7th** (Saturday), the plan changes.",
  "",
  "1. **Recent history:** The last session was on **Nov 06**. It does *not* include today.",
  "2. **Tomorrow:** you mentioned a **10k run**.",
  "    * If the run is **Nov 8th**, today is a gym day.",
  "    * If the run is *today*, skip the gym.",
  "",
  "**Recommendation:**",
  "This is an appropriate day for a gym session.",
].join("\n");

describe("coach markdown", () => {
  it("renders bold, italic, and nested lists without leaving the markers in the text", () => {
    const blocks = parseCoachMarkdown(sample);
    expect(blocks.map((block) => block.kind)).toEqual(["paragraph", "list", "paragraph"]);
    const intro = blocks[0];
    expect(intro?.kind).toBe("paragraph");
    if (intro?.kind !== "paragraph") return;
    expect(intro.children).toContainEqual({ kind: "strong", children: [{ kind: "text", text: "today is November 7th" }] });
    expect(JSON.stringify(intro)).not.toContain("**");

    const list = blocks[1];
    expect(list?.kind).toBe("list");
    if (list?.kind !== "list") return;
    expect(list.ordered).toBe(true);
    expect(list.items).toHaveLength(2);
    expect(list.items[1]?.lists[0]?.ordered).toBe(false);
    expect(list.items[1]?.lists[0]?.items).toHaveLength(2);
    expect(JSON.stringify(list)).not.toContain("*not*");
    expect(JSON.stringify(list)).toContain("not");
  });

  it("keeps an unclosed marker as text while a reply is still streaming", () => {
    const [block] = parseCoachMarkdown("Wait for **tomorrow");
    expect(block).toEqual({ kind: "paragraph", children: [{ kind: "text", text: "Wait for **tomorrow" }] });
  });

  it("renders inline code separately from the surrounding sentence", () => {
    const [block] = parseCoachMarkdown("The field `recentActivities` is internal.");
    expect(block).toEqual({
      kind: "paragraph",
      children: [
        { kind: "text", text: "The field " },
        { kind: "code", text: "recentActivities" },
        { kind: "text", text: " is internal." },
      ],
    });
  });
});
