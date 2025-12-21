import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";

import {
  canTriggerSlashFromText,
  createSlashMenuRenderer,
  filterSlashItems,
  type SlashCommandItem,
} from "../menus/SlashMenu";

const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashCommandItem>({
        editor: this.editor,
        char: "/",
        allowSpaces: true,
        startOfLine: false,
        allowedPrefixes: null,
        items: ({ query }) => filterSlashItems(query),
        allow: ({ state, range, editor }) => {
          const $pos = state.doc.resolve(range.from);
          const blockStart = Math.max(0, range.from - $pos.parentOffset);
          const textBeforeTrigger = state.doc.textBetween(
            blockStart,
            range.from,
            "\n",
            " "
          );

          return canTriggerSlashFromText({
            textBefore: textBeforeTrigger,
            isCodeBlock: editor.isActive("codeBlock"),
          });
        },
        command: ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).run();
          props.command(editor);
        },
        render: () => createSlashMenuRenderer(),
      }),
    ];
  },
});

export default SlashCommand;
