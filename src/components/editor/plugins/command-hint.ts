import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { shouldShowCommandHint } from "../utils/editorUi";

type CommandHintState = {
  from: number | null;
  to: number | null;
  focused: boolean;
  show: boolean;
};

const pluginKey = new PluginKey<CommandHintState>("commandHint");

const findFirstEmptyParagraph = (doc: {
  descendants: (fn: (node: any, pos: number) => boolean | void) => void;
}) => {
  let range: { from: number; to: number } | null = null;
  doc.descendants((node: any, pos: number) => {
    if (node.type?.name === "paragraph" && node.content?.size === 0) {
      range = { from: pos, to: pos + node.nodeSize };
      return false;
    }
    return true;
  });
  return range;
};

export const commandHintPlugin = () => {
  return new Plugin<CommandHintState>({
    key: pluginKey,
    state: {
      init: (_, state) => {
        const show = shouldShowCommandHint(state.doc);
        const range = show ? findFirstEmptyParagraph(state.doc) : null;
        return {
          from: range?.from ?? null,
          to: range?.to ?? null,
          focused: false,
          show,
        };
      },
      apply: (tr, prev) => {
        const meta = tr.getMeta(pluginKey) as
          | Partial<CommandHintState>
          | undefined;

        let next: CommandHintState = {
          from: prev.from,
          to: prev.to,
          focused: meta?.focused ?? prev.focused,
          show: prev.show,
        };

        if (tr.docChanged || tr.selectionSet) {
          const show = shouldShowCommandHint(tr.doc);
          const range = show ? findFirstEmptyParagraph(tr.doc) : null;
          next = {
            ...next,
            show,
            from: range?.from ?? null,
            to: range?.to ?? null,
          };
        }

        if (meta?.from !== undefined) {
          next.from = meta.from;
        }
        if (meta?.to !== undefined) {
          next.to = meta.to;
        }
        if (meta?.show !== undefined) {
          next.show = meta.show;
        }

        return next;
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);
        if (
          !pluginState ||
          (!pluginState.focused && !pluginState.show) ||
          !pluginState.show ||
          pluginState.from === null ||
          pluginState.to === null
        ) {
          return DecorationSet.empty;
        }

        const hint = Decoration.node(pluginState.from, pluginState.to, {
          class: "memoir-command-hint",
          "data-hint": "Type / for commands",
        });

        return DecorationSet.create(state.doc, [hint]);
      },
      handleDOMEvents: {
        focus: (view) => {
          const prev = pluginKey.getState(view.state);
          if (prev && !prev.focused) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, { focused: true })
            );
          }
          return false;
        },
        blur: (view) => {
          const prev = pluginKey.getState(view.state);
          if (prev?.focused) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, { focused: false })
            );
          }
          return false;
        },
      },
    },
  });
};
