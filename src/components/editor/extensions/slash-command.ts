import { Extension } from "@tiptap/core";
import Suggestion, {
  type SuggestionKeyDownProps,
  type SuggestionProps,
} from "@tiptap/suggestion";
import tippy, { type Instance } from "tippy.js";

type SlashCommandItem = {
  title: string;
  description?: string;
  command: (editor: SuggestionProps<SlashCommandItem>["editor"]) => void;
};

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    command: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: "Paragraph",
    description: "Start writing with plain text",
    command: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    title: "Bulleted list",
    description: "Create a bulleted list",
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: "Numbered list",
    description: "Create a numbered list",
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: "To-do list",
    description: "Track tasks with checkboxes",
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: "Divider",
    description: "Insert a horizontal rule",
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
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
  },
  {
    title: "Quote",
    description: "Capture a quote",
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: "Code block",
    description: "Insert a code snippet",
    command: (editor) => editor.chain().focus().setCodeBlock().run(),
  },
];

const getItems = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return COMMANDS;
  return COMMANDS.filter((item) =>
    item.title.toLowerCase().includes(normalized)
  );
};

const createMenu = () => {
  const container = document.createElement("div");
  container.className = "slash-command-menu";

  let props: SuggestionProps<SlashCommandItem>;
  let selectedIndex = 0;

  const render = () => {
    container.innerHTML = "";

    if (!props.items.length) {
      const empty = document.createElement("div");
      empty.className = "slash-command-empty";
      empty.textContent = "No results";
      container.appendChild(empty);
      return;
    }

    props.items.forEach((item, index) => {
      const option = document.createElement("div");
      option.className = "slash-command-item";
      if (index === selectedIndex) option.classList.add("is-selected");

      const title = document.createElement("div");
      title.className = "slash-command-item-title";
      title.textContent = item.title;
      option.appendChild(title);

      if (item.description) {
        const description = document.createElement("div");
        description.className = "slash-command-item-desc";
        description.textContent = item.description;
        option.appendChild(description);
      }

      option.addEventListener("click", () => {
        props.command(item);
      });

      container.appendChild(option);
    });
  };

  const update = (nextProps: SuggestionProps<SlashCommandItem>) => {
    props = nextProps;
    selectedIndex = 0;
    render();
  };

  const moveSelection = (direction: "up" | "down") => {
    const count = props.items.length;
    if (!count) return;
    const delta = direction === "up" ? -1 : 1;
    selectedIndex = (selectedIndex + delta + count) % count;
    render();
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

  return { element: container, update, onKeyDown };
};

const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: false,
        startOfLine: false,
        allowedPrefixes: null,
        items: ({ query }) => getItems(query),

        // ✅ FIXED: allow in any block when "/" is typed at block start or after whitespace
        allow: ({ state, range, editor }) => {
          if (editor.isActive("codeBlock")) return false;

          const $pos = state.doc.resolve(range.from);
          const parent = $pos.parent;

          // exclude the "/" trigger itself
          const offsetBeforeTrigger = Math.max(0, $pos.parentOffset - 1);

          const textBeforeTrigger = parent.textBetween(
            0,
            offsetBeforeTrigger,
            "\n",
            "\n"
          );

          return /^\s*$/.test(textBeforeTrigger);
        },

        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },

        render: () => {
          let popup: Instance | null = null;
          let menu: ReturnType<typeof createMenu> | null = null;

          return {
            onStart: (props) => {
              menu = createMenu();
              menu.update(props);

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect ?? undefined,
                appendTo: () => document.body,
                content: menu.element,
                showOnCreate: true,
                interactive: true,
                trigger: "manual",
                placement: "bottom-start",
                offset: [0, 8],
                theme: "slash",
              }) as unknown as Instance;
            },

            onUpdate: (props) => {
              menu?.update(props);
              popup?.setProps({
                getReferenceClientRect: props.clientRect ?? undefined,
              });
            },

            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === "Escape") {
                popup?.hide();
                return true;
              }
              return menu?.onKeyDown(props.event) ?? false;
            },

            onExit: () => {
              popup?.destroy();
              popup = null;
              menu = null;
            },
          };
        },
      }),
    ];
  },
});

export default SlashCommand;
