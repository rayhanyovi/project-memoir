import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

type ActiveBlockState = {
  from: number | null;
  to: number | null;
  focused: boolean;
};

const pluginKey = new PluginKey<ActiveBlockState>("activeBlock");

const resolveTopLevelBlockRange = (state: {
  doc: { nodeAt: (pos: number) => any; resolve: (pos: number) => any };
  selection: { $from: any };
}) => {
  const { $from } = state.selection;
  if ($from.depth < 1) {
    return null;
  }
  const from = $from.before(1);
  const node = state.doc.nodeAt(from);
  if (!node) {
    return null;
  }
  return { from, to: from + node.nodeSize };
};

export const activeBlockPlugin = () => {
  return new Plugin<ActiveBlockState>({
    key: pluginKey,
    state: {
      init: (_, state) => {
        const range = resolveTopLevelBlockRange(state);
        return {
          from: range?.from ?? null,
          to: range?.to ?? null,
          focused: false,
        };
      },
      apply: (tr, prev) => {
        const meta = tr.getMeta(pluginKey) as
          | Partial<ActiveBlockState>
          | undefined;
        const next: ActiveBlockState = {
          from: prev.from,
          to: prev.to,
          focused: meta?.focused ?? prev.focused,
        };

        if (tr.docChanged && next.from !== null && next.to !== null) {
          const fromResult = tr.mapping.mapResult(next.from, 1);
          const toResult = tr.mapping.mapResult(next.to, -1);
          if (
            fromResult.deleted ||
            toResult.deleted ||
            fromResult.pos >= toResult.pos
          ) {
            next.from = null;
            next.to = null;
          } else {
            next.from = fromResult.pos;
            next.to = toResult.pos;
          }
        }

        if (tr.selectionSet) {
          const range = resolveTopLevelBlockRange(tr);
          next.from = range?.from ?? null;
          next.to = range?.to ?? null;
        }

        if (meta?.from !== undefined) {
          next.from = meta.from;
        }
        if (meta?.to !== undefined) {
          next.to = meta.to;
        }

        return next;
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);
        if (
          !pluginState ||
          !pluginState.focused ||
          pluginState.from === null ||
          pluginState.to === null
        ) {
          return DecorationSet.empty;
        }

        const active = Decoration.node(pluginState.from, pluginState.to, {
          class: "memoir-active-block",
        });
        return DecorationSet.create(state.doc, [active]);
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
              view.state.tr.setMeta(pluginKey, {
                focused: false,
                from: null,
                to: null,
              })
            );
          }
          return false;
        },
      },
    },
  });
};
