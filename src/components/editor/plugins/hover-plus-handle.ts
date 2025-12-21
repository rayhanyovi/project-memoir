import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

import { getNodeTypeOffset } from "../utils/editorUi";

type HoverPlusHandleState = {
  pos: number | null;
  from: number | null;
  to: number | null;
  nodeType: string | null;
  nodeAttrs?: Record<string, unknown> | null;
  focused: boolean;
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
        focused: false,
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
          focused: meta.focused ?? prev.focused,
        };
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);
        if (
          !pluginState ||
          !pluginState.focused ||
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

            const button = document.createElement("button");
            button.type = "button";
            button.className = "tiptap-hover-handle-button";
            button.textContent = "+";
            button.setAttribute("aria-label", "Add block");
            button.style.top = `${-2 + offset.top}px`;
            button.style.left = `${-32 + offset.left}px`;
            button.dataset.nodeType = nodeType;

            button.addEventListener("mousedown", (event) => {
              event.preventDefault();
            });

            button.addEventListener("click", (event) => {
              event.preventDefault();
              const nextPos = Math.min(pos + 1, editor.state.doc.content.size);
              editor.chain().focus().setTextSelection(nextPos).insertContent("/").run();
            });

            container.appendChild(button);
            return container;
          },
          { side: -1, key: `hover-plus-${pos}` }
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
          if (!view.hasFocus()) {
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
            prev.nodeType !== node.type.name ||
            !prev.focused
          ) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                pos: nextPos,
                from,
                to,
                nodeType: node.type.name,
                nodeAttrs: node.attrs ?? null,
                focused: true,
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
          if (prev && (prev.focused || prev.pos !== null)) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, {
                focused: false,
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
