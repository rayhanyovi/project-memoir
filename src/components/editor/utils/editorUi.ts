type JsonNode = {
  type?: string;
  text?: string;
  content?: JsonNode[];
  attrs?: Record<string, unknown>;
};

export type NodeOffset = {
  top: number;
  left: number;
};

export const getNodeTypeOffset = (
  nodeType: string,
  attrs?: Record<string, unknown>
): NodeOffset => {
  if (nodeType === "heading") {
    const level = Number((attrs ?? {}).level ?? 1);
    if (level === 1) {
      return { top: 8, left: 0 };
    }
    if (level === 2) {
      return { top: 6, left: 0 };
    }
    if (level === 3) {
      return { top: 5, left: 0 };
    }
    return { top: 4, left: 0 };
  }

  if (
    nodeType === "bulletList" ||
    nodeType === "orderedList" ||
    nodeType === "taskList" ||
    nodeType === "listItem" ||
    nodeType === "taskItem"
  ) {
    return { top: 4, left: 12 };
  }

  if (
    nodeType === "blockquote" ||
    nodeType === "codeBlock" ||
    nodeType === "table"
  ) {
    return { top: 6, left: 0 };
  }

  return { top: 4, left: 0 };
};

const hasText = (node: JsonNode | null | undefined): boolean => {
  if (!node) {
    return false;
  }

  if (typeof node.text === "string" && node.text.trim().length > 0) {
    return true;
  }

  if (Array.isArray(node.content)) {
    return node.content.some((child) => hasText(child));
  }

  return false;
};

export const shouldShowCommandHint = (doc: unknown): boolean => {
  if (!doc) {
    return true;
  }

  const normalized =
    typeof doc === "object" && doc !== null && "toJSON" in doc
      ? (doc as { toJSON: () => JsonNode }).toJSON()
      : (doc as JsonNode);

  if (!normalized || normalized.type !== "doc") {
    return true;
  }

  return !hasText(normalized);
};
