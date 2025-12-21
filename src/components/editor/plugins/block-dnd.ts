import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

type BlockDndState = {
  draggingFrom: number | null;
  dropPos: number | null;
};

const pluginKey = new PluginKey<BlockDndState>("blockDnd");

const draggableNodeTypes = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "table",
  "bulletList",
  "orderedList",
  "taskList",
]);

const BLOCK_SELECTOR = "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table";

const findTopLevelBlockFromPos = (
  view: EditorView,
  pos: number
): { from: number; to: number } | null => {
  const $pos = view.state.doc.resolve(pos);
  if ($pos.depth < 1) return null;
  const from = $pos.before(1);
  const node = view.state.doc.nodeAt(from);
  if (!node || !node.isBlock) return null;
  return { from, to: from + node.nodeSize };
};

const findBlockFromEventTarget = (view: EditorView, event: DragEvent) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return null;

  const wrapper =
    target.closest("[data-memoir-wrapper]") ??
    target.closest(".memoir-block-wrapper");
  const block =
    wrapper?.closest("li") ??
    wrapper?.querySelector(BLOCK_SELECTOR) ??
    target.closest(BLOCK_SELECTOR);
  if (!(block instanceof HTMLElement)) return null;

  const pos = view.posAtDOM(block, 0);
  if (pos === null || Number.isNaN(pos)) return null;

  const node = view.state.doc.nodeAt(pos);
  if (!node) return null;

  const rect = block.getBoundingClientRect();
  const middle = rect.top + rect.height / 2;
  const after = pos + node.nodeSize;

  return event.clientY <= middle ? pos : after;
};

const clampCoordsToEditor = (
  view: EditorView,
  event: DragEvent
): { pos: number } | null => {
  const editorRect = (view.dom as HTMLElement).getBoundingClientRect();
  const left = Math.min(
    Math.max(event.clientX, editorRect.left + 2),
    editorRect.right - 2
  );
  const top = Math.min(
    Math.max(event.clientY, editorRect.top + 2),
    editorRect.bottom - 2
  );

  return view.posAtCoords({ left, top });
};

const resolveDropPosition = (
  view: EditorView,
  event: DragEvent
): number | null => {
  const coords =
    view.posAtCoords({
      left: event.clientX,
      top: event.clientY,
    }) ?? clampCoordsToEditor(view, event);
  if (!coords) {
    return findBlockFromEventTarget(view, event);
  }

  const blockRange = findTopLevelBlockFromPos(view, coords.pos);
  if (!blockRange) {
    return findBlockFromEventTarget(view, event);
  }

  const domAtPos = view.nodeDOM(blockRange.from) as HTMLElement | null;
  const node = view.state.doc.nodeAt(blockRange.from);
  if (!domAtPos || !node) return blockRange.from;

  const rect = domAtPos.getBoundingClientRect();
  const middle = rect.top + rect.height / 2;
  const after = blockRange.from + node.nodeSize;

  return event.clientY <= middle ? blockRange.from : after;
};

export const blockDndPlugin = () => {
  return new Plugin<BlockDndState>({
    key: pluginKey,
    state: {
      init: () => ({ draggingFrom: null, dropPos: null }),
      apply: (tr, prev) => {
        const meta = tr.getMeta(pluginKey) as
          | Partial<BlockDndState>
          | undefined;
        if (!meta) return prev;

        return {
          draggingFrom: meta.draggingFrom ?? prev.draggingFrom,
          dropPos: meta.dropPos ?? prev.dropPos,
        };
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);
        if (!pluginState || pluginState.dropPos === null) {
          return DecorationSet.empty;
        }

        const dropIndicator = Decoration.widget(
          pluginState.dropPos,
          () => {
            const line = document.createElement("div");
            line.className = "memoir-drop-indicator";
            return line;
          },
          { key: `drop-${pluginState.dropPos}`, side: -1 }
        );

        return DecorationSet.create(state.doc, [dropIndicator]);
      },
      handleDOMEvents: {
        dragstart: (view, event) => {
          if (!(event.target instanceof HTMLElement)) return false;
          const handle = event.target.closest(".memoir-handle-drag");
          if (!(handle instanceof HTMLElement)) return false;

          const from = Number(handle.dataset.from ?? NaN);
          if (Number.isNaN(from)) return false;

          const node = view.state.doc.nodeAt(from);
          if (!node || !draggableNodeTypes.has(node.type.name)) return false;

          if (event.dataTransfer) {
            event.dataTransfer.setData("application/x-memoir-block", "1");
            event.dataTransfer.setDragImage(handle, 8, 8);
            event.dataTransfer.setData("text/plain", node.type.name);
            event.dataTransfer.effectAllowed = "move";
          }

          view.dispatch(
            view.state.tr.setMeta(pluginKey, {
              draggingFrom: from,
              dropPos: null,
            })
          );
          return true;
        },
        dragover: (view, event) => {
          const state = pluginKey.getState(view.state);
          if (state?.draggingFrom === null) return false;

          const dropPos = resolveDropPosition(view, event);
          if (dropPos === null) return false;

          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = "move";
          }

          if (state?.dropPos !== dropPos) {
            view.dispatch(view.state.tr.setMeta(pluginKey, { dropPos }));
          }
          return true;
        },
        drop: (view, event) => {
          const state = pluginKey.getState(view.state);
          if (state?.draggingFrom === null || state?.dropPos === null) {
            return false;
          }

          const node = view.state.doc.nodeAt(state?.draggingFrom ?? 0);
          if (!node || !draggableNodeTypes.has(node.type.name)) {
            return false;
          }

          event.preventDefault();
          const from = state.draggingFrom;
          if (from === null) return true;
          const to = from + node.nodeSize;
          let insertPos = state.dropPos;

          if (insertPos === from || insertPos === to) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                draggingFrom: null,
                dropPos: null,
              })
            );
            return true;
          }

          if (insertPos > from && insertPos <= to) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                draggingFrom: null,
                dropPos: null,
              })
            );
            return true;
          }

          if (insertPos > from) {
            insertPos -= node.nodeSize;
          }

          const tr = view.state.tr.delete(from, to).insert(insertPos, node);
          view.dispatch(
            tr.setMeta(pluginKey, { draggingFrom: null, dropPos: null })
          );
          return true;
        },
        dragend: (view) => {
          const state = pluginKey.getState(view.state);
          if (!state) return false;
          if (state.draggingFrom !== null || state.dropPos !== null) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                draggingFrom: null,
                dropPos: null,
              })
            );
          }
          return false;
        },
        dragleave: (view, event) => {
          if (!(event.relatedTarget instanceof HTMLElement)) {
            const state = pluginKey.getState(view.state);
            if (state?.dropPos !== null) {
              view.dispatch(
                view.state.tr.setMeta(pluginKey, { dropPos: null })
              );
            }
          }
          return false;
        },
      },
    },
  });
};
