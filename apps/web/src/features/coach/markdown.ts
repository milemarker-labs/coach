export type Inline =
  | { kind: "text"; text: string }
  | { kind: "strong"; children: Inline[] }
  | { kind: "em"; children: Inline[] }
  | { kind: "code"; text: string }
  | { kind: "break" };

export interface ListItem {
  children: Inline[];
  lists: ListBlock[];
}

export interface ListBlock {
  kind: "list";
  ordered: boolean;
  items: ListItem[];
}

export type Block = { kind: "paragraph"; children: Inline[] } | ListBlock;

const LIST_LINE = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

/** Coach replies use a small markdown subset: bold, italic, code, and nested lists. */
export function parseCoachMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;
  while (index < lines.length) {
    if (lines[index]?.trim() === "") {
      index += 1;
      continue;
    }
    if (isListLine(lines[index] ?? "")) {
      const collected: string[] = [];
      while (index < lines.length && isListLine(lines[index] ?? "")) {
        collected.push(lines[index] ?? "");
        index += 1;
      }
      blocks.push(...parseLists(collected.map(toListLine)));
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length && lines[index]?.trim() !== "" && !isListLine(lines[index] ?? "")) {
      paragraph.push(lines[index] ?? "");
      index += 1;
    }
    blocks.push({ kind: "paragraph", children: parseInline(paragraph.join("\n")) });
  }
  return blocks;
}

interface ListLine {
  indent: number;
  ordered: boolean;
  text: string;
}

function isListLine(line: string): boolean {
  return LIST_LINE.test(line);
}

function toListLine(line: string): ListLine {
  const match = LIST_LINE.exec(line);
  const marker = match?.[2] ?? "-";
  return {
    indent: (match?.[1] ?? "").replace(/\t/g, "  ").length,
    ordered: /^\d/.test(marker),
    text: match?.[3] ?? "",
  };
}

function parseLists(lines: ListLine[]): ListBlock[] {
  const blocks: ListBlock[] = [];
  let index = 0;
  while (index < lines.length) {
    const parsed = parseItems(lines, index, lines[index]?.indent ?? 0);
    if (parsed.next === index) break;
    blocks.push({ kind: "list", ordered: lines[index]?.ordered ?? false, items: parsed.items });
    index = parsed.next;
  }
  return blocks;
}

function parseItems(lines: ListLine[], start: number, indent: number): { items: ListItem[]; next: number } {
  const items: ListItem[] = [];
  const ordered = lines[start]?.ordered ?? false;
  let index = start;
  while (index < lines.length && lines[index]?.indent === indent && lines[index]?.ordered === ordered) {
    const children = parseInline(lines[index]?.text ?? "");
    index += 1;
    const lists: ListBlock[] = [];
    const nested = lines[index];
    if (nested && nested.indent > indent) {
      const parsed = parseItems(lines, index, nested.indent);
      lists.push({ kind: "list", ordered: nested.ordered, items: parsed.items });
      index = parsed.next;
    }
    items.push({ children, lists });
  }
  return { items, next: index };
}

export function parseInline(text: string): Inline[] {
  const lines = text.split("\n");
  const result: Inline[] = [];
  lines.forEach((line, index) => {
    if (index > 0) result.push({ kind: "break" });
    result.push(...parseInlineLine(line));
  });
  return result;
}

function parseInlineLine(input: string): Inline[] {
  const nodes: Inline[] = [];
  let text = "";
  let index = 0;
  const flush = () => {
    if (text.length === 0) return;
    nodes.push({ kind: "text", text });
    text = "";
  };
  while (index < input.length) {
    if (input.startsWith("**", index)) {
      const end = input.indexOf("**", index + 2);
      if (end !== -1) {
        flush();
        nodes.push({ kind: "strong", children: parseInlineLine(input.slice(index + 2, end)) });
        index = end + 2;
        continue;
      }
    }
    if (input[index] === "`") {
      const end = input.indexOf("`", index + 1);
      if (end !== -1) {
        flush();
        nodes.push({ kind: "code", text: input.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }
    if (input[index] === "*" && input[index + 1] !== "*") {
      const end = input.indexOf("*", index + 1);
      if (end > index + 1) {
        flush();
        nodes.push({ kind: "em", children: parseInlineLine(input.slice(index + 1, end)) });
        index = end + 1;
        continue;
      }
    }
    text += input[index];
    index += 1;
  }
  flush();
  return nodes;
}
