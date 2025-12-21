const BLOCK_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "quote",
  "codeBlock",
  "code_block",
  "bulletList",
  "bullet_list",
  "orderedList",
  "ordered_list",
  "listItem",
  "list_item",
  "taskList",
  "task_list",
  "taskItem",
  "task_item",
  "todo",
]);

const collectInlineText = (node: unknown): string => {
  if (!node) {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map(collectInlineText).join("");
  }

  if (typeof node !== "object") {
    return "";
  }

  const record = node as Record<string, unknown>;
  let text = "";

  if (typeof record.text === "string") {
    text += record.text;
  }

  if (Array.isArray(record.content)) {
    text += record.content.map(collectInlineText).join("");
  }

  return text;
};

const collectBlocks = (node: unknown, blocks: string[]) => {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectBlocks(child, blocks));
    return;
  }

  if (typeof node !== "object") {
    return;
  }

  const record = node as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";

  if (BLOCK_NODE_TYPES.has(type)) {
    blocks.push(collectInlineText(record));
    return;
  }

  if (Array.isArray(record.content)) {
    record.content.forEach((child) => collectBlocks(child, blocks));
    return;
  }

  if (typeof record.text === "string") {
    blocks.push(record.text);
  }
};

export const extractPlainText = (doc: unknown): string => {
  const blocks: string[] = [];

  try {
    collectBlocks(doc, blocks);
  } catch {
    return "";
  }

  return blocks.join("\n");
};
