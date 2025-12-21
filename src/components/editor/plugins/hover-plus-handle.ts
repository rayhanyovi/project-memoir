import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { getNodeTypeOffset } from "../utils/editorUi";

type HoverPlusHandleState = {
  pos: number | null;
  from: number | null;
  to: number | null;
  nodeType: string | null;
  nodeAttrs?: Record<string, unknown> | null;
};

type HoverPlusHandleOptions = {
  editor: Editor;
};

const pluginKey = new PluginKey<HoverPlusHandleState>("hoverPlusHandle");

const findTopLevelBlock = (target: HTMLElement, editorDom: HTMLElement) => {
  let el: HTMLElement | null = target;
  while (el && el !== editorDom) {
    if (el.parentElement === editorDom) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
};

const allowedDragNodeTypes = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "table",
  "bulletList",
  "orderedList",
  "taskList",
]);

export const hoverPlusHandlePlugin = ({ editor }: HoverPlusHandleOptions) => {
  return new Plugin<HoverPlusHandleState>({
    key: pluginKey,
    state: {
      init: () => ({
        pos: null,
        from: null,
        to: null,
        nodeType: null,
        nodeAttrs: null,
      }),
      apply: (tr, prev) => {
        const meta = tr.getMeta(pluginKey) as
          | Partial<HoverPlusHandleState>
          | undefined;
        if (!meta) {
          return prev;
        }
        return {
          pos: meta.pos ?? prev.pos,
          from: meta.from ?? prev.from,
          to: meta.to ?? prev.to,
          nodeType: meta.nodeType ?? prev.nodeType,
          nodeAttrs: meta.nodeAttrs ?? prev.nodeAttrs,
        };
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);
        if (
          !pluginState ||
          pluginState.pos === null ||
          pluginState.from === null ||
          pluginState.to === null ||
          !pluginState.nodeType
        ) {
          return DecorationSet.empty;
        }

        const { pos, from, to, nodeType, nodeAttrs } = pluginState;
        const offset = getNodeTypeOffset(nodeType, nodeAttrs ?? undefined);
        const widget = Decoration.widget(
          Math.min(pos + 1, state.doc.content.size),
          () => {
            const container = document.createElement("span");
            container.className = "tiptap-hover-handle";
            container.setAttribute("contenteditable", "false");

            const wrapper = document.createElement("div");
            wrapper.className = "memoir-handle-surface";
            wrapper.style.top = `${offset.top}px`;
            wrapper.style.left = `${-48 + offset.left}px`;
            wrapper.dataset.nodeType = nodeType;

            const addButton = document.createElement("button");
            addButton.type = "button";
            addButton.className = "memoir-handle-button";
            addButton.textContent = "+";
            addButton.setAttribute("aria-label", "Add block");
            addButton.dataset.nodeType = nodeType;

            addButton.addEventListener("mousedown", (event) => {
              event.preventDefault();
            });

            addButton.addEventListener("click", (event) => {
              event.preventDefault();
              const { state } = editor;
              const node = state.doc.nodeAt(from);
              const insertAfter = node ? from + node.nodeSize : to;

              editor
                .chain()
                .focus()
                .command(({ tr, dispatch }) => {
                  const paragraph = tr.doc.type.schema.nodes.paragraph.create();
                  const targetPos =
                    node &&
                    node.type.name === "paragraph" &&
                    node.content.size === 0
                      ? from
                      : insertAfter;

                  if (
                    targetPos + paragraph.nodeSize <= tr.doc.content.size + 2 &&
                    !(
                      node &&
                      node.type.name === "paragraph" &&
                      node.content.size === 0
                    )
                  ) {
                    tr.insert(targetPos, paragraph);
                  }

                  const selectionPos =
                    targetPos + 1 > tr.doc.content.size
                      ? tr.doc.content.size
                      : targetPos + 1;

                  tr.setSelection(TextSelection.create(tr.doc, selectionPos));
                  dispatch?.(tr);
                  return true;
                })
                .insertContent("/")
                .run();
            });

            const dragHandle = document.createElement("button");
            dragHandle.type = "button";
            dragHandle.className = "memoir-handle-button memoir-handle-drag";
            dragHandle.textContent = "⋮⋮";
            dragHandle.setAttribute("aria-label", "Drag block");
            dragHandle.draggable = true;
            dragHandle.dataset.from = from.toString();
            dragHandle.dataset.nodeType = nodeType;

            wrapper.appendChild(addButton);
            if (allowedDragNodeTypes.has(nodeType)) {
              wrapper.appendChild(dragHandle);
            }
            container.appendChild(wrapper);
            return container;
          },
          { side: -1, key: `hover-plus-${pos}`, ignoreSelection: true }
        );

        const hoverBlock = Decoration.node(from, to, {
          class: "memoir-hover-block",
        });

        return DecorationSet.create(state.doc, [hoverBlock, widget]);
      },
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (!(event.target instanceof HTMLElement)) {
            return false;
          }

          const block = findTopLevelBlock(event.target, view.dom);
          const nextPos = block ? view.posAtDOM(block, 0) : null;
          const prev = pluginKey.getState(view.state);

          if (!nextPos) {
            if (prev?.pos !== null) {
              view.dispatch(
                view.state.tr.setMeta(pluginKey, {
                  pos: null,
                  from: null,
                  to: null,
                  nodeType: null,
                  nodeAttrs: null,
                })
              );
            }
            return false;
          }

          const $pos = view.state.doc.resolve(nextPos);
          let node = $pos.nodeAfter;
          let from = $pos.pos;
          if (!node || !node.isBlock) {
            const depth = Math.max(1, $pos.depth);
            from = $pos.before(depth);
            node = view.state.doc.nodeAt(from) ?? null;
          }
          if (!node) {
            return false;
          }
          const to = from + node.nodeSize;

          if (
            !prev ||
            prev.pos !== nextPos ||
            prev.from !== from ||
            prev.to !== to ||
            prev.nodeType !== node.type.name
          ) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                pos: nextPos,
                from,
                to,
                nodeType: node.type.name,
                nodeAttrs: node.attrs ?? null,
              })
            );
          }

          return false;
        },
        mouseleave: (view) => {
          const prev = pluginKey.getState(view.state);
          if (prev?.pos !== null) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                pos: null,
                from: null,
                to: null,
                nodeType: null,
                nodeAttrs: null,
              })
            );
          }
          return false;
        },
        blur: (view) => {
          const prev = pluginKey.getState(view.state);
          if (prev?.pos !== null) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                pos: null,
                from: null,
                to: null,
                nodeType: null,
                nodeAttrs: null,
              })
            );
          }
          return false;
        },
      },
    },
    view: () => {
      return {};
    },
  });
};
