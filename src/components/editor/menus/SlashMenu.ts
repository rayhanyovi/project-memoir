import type {
  SuggestionKeyDownProps,
  SuggestionProps,
} from "@tiptap/suggestion";
import tippy, { type Instance, type Props as TippyProps } from "tippy.js";

export type SlashCommandItem = {
  title: string;
  description?: string;
  command: (editor: SuggestionProps<SlashCommandItem>["editor"]) => void;
  keywords?: string[];
};

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    keywords: ["h1", "title"],
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    keywords: ["h2", "subtitle"],
  },
  {
    title: "Paragraph",
    description: "Start writing with plain text",
    command: (editor) => editor.chain().focus().setParagraph().run(),
    keywords: ["text", "body"],
  },
  {
    title: "Bulleted list",
    description: "Create a bulleted list",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    keywords: ["list", "bullet"],
  },
  {
    title: "Numbered list",
    description: "Create a numbered list",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    keywords: ["list", "numbered", "ordered"],
  },
  {
    title: "To-do list",
    description: "Track tasks with checkboxes",
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
    keywords: ["tasks", "todo", "checkbox"],
  },
  {
    title: "Divider",
    description: "Insert a horizontal rule",
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
    keywords: ["hr", "separator", "line"],
  },
  {
    title: "Table (3x3)",
    description: "Insert a simple table",
    command: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    keywords: ["table", "grid"],
  },
  {
    title: "Quote",
    description: "Capture a quote",
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
    keywords: ["blockquote", "quotation"],
  },
  {
    title: "Code block",
    description: "Insert a code snippet",
    command: (editor) => editor.chain().focus().setCodeBlock().run(),
    keywords: ["code", "snippet"],
  },
];

export const filterSlashItems = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return slashCommandItems;

  return slashCommandItems.filter((item) => {
    const haystack = [
      item.title.toLowerCase(),
      item.description?.toLowerCase() ?? "",
      ...(item.keywords ?? []).map((keyword) => keyword.toLowerCase()),
    ].join(" ");

    return haystack.includes(normalized);
  });
};

export const canTriggerSlashFromText = ({
  textBefore,
  isCodeBlock,
}: {
  textBefore: string;
  isCodeBlock: boolean;
}) => {
  if (isCodeBlock) return false;
  return /^\s*$/.test(textBefore);
};

const createEmptyState = (label: string) => {
  const empty = document.createElement("div");
  empty.className = "memoir-slash-empty";
  empty.textContent = label;
  return empty;
};

export const createSlashMenuRenderer = () => {
  const container = document.createElement("div");
  container.className = "memoir-slash-menu";

  const list = document.createElement("div");
  list.className = "memoir-slash-list";
  container.appendChild(list);

  let popup: Instance | null = null;
  let props: SuggestionProps<SlashCommandItem>;
  let selectedIndex = 0;

  const renderItems = () => {
    list.innerHTML = "";

    if (!props.items.length) {
      list.appendChild(createEmptyState("No results"));
      return;
    }

    props.items.forEach((item, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "memoir-slash-item";
      option.dataset.index = index.toString();
      if (index === selectedIndex) {
        option.classList.add("is-selected");
      }

      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });

      option.addEventListener("click", () => {
        props.command(item);
      });

      const title = document.createElement("div");
      title.className = "memoir-slash-title";
      title.textContent = item.title;

      const description = document.createElement("div");
      description.className = "memoir-slash-desc";
      description.textContent = item.description ?? "";

      option.appendChild(title);
      option.appendChild(description);
      list.appendChild(option);
    });
  };

  const update = (nextProps: SuggestionProps<SlashCommandItem>) => {
    const shouldReset = !props || nextProps.query !== props.query;
    props = nextProps;
    selectedIndex = shouldReset
      ? 0
      : props.items.length === 0
        ? 0
        : Math.min(selectedIndex, props.items.length - 1);
    renderItems();
  };

  const moveSelection = (direction: "up" | "down") => {
    if (!props.items.length) return;
    const delta = direction === "up" ? -1 : 1;
    const count = props.items.length;
    selectedIndex = (selectedIndex + delta + count) % count;
    renderItems();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowUp") {
      moveSelection("up");
      return true;
    }
    if (event.key === "ArrowDown") {
      moveSelection("down");
      return true;
    }
    if (event.key === "Enter") {
      const item = props.items[selectedIndex];
      if (item) props.command(item);
      return true;
    }
    return false;
  };

  const updatePopupPosition = () => {
    if (!popup || !props.clientRect) return;
    popup.setProps({
      getReferenceClientRect: props.clientRect,
    } satisfies Partial<TippyProps>);
    popup.popperInstance?.update();
  };

  return {
    onStart: (startProps: SuggestionProps<SlashCommandItem>) => {
      props = startProps;
      selectedIndex = 0;
      renderItems();

      popup = tippy(document.body, {
        getReferenceClientRect: props.clientRect ?? undefined,
        appendTo: () => document.body,
        content: container,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
        offset: [0, 6],
        maxWidth: 320,
        moveTransition: "transform 120ms ease",
        animation: "shift-away-subtle",
        theme: "slash",
      }) as unknown as Instance;
    },

    onUpdate: (nextProps: SuggestionProps<SlashCommandItem>) => {
      update(nextProps);
      updatePopupPosition();
    },

    onKeyDown: (keyProps: SuggestionKeyDownProps) => {
      if (keyProps.event.key === "Escape") {
        popup?.hide();
        return true;
      }
      return onKeyDown(keyProps.event);
    },

    onExit: () => {
      popup?.destroy();
      popup = null;
      list.innerHTML = "";
    },
  };
};
