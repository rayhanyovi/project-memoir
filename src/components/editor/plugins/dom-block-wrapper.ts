import type { Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

type DomWrapperState = {
  block: HTMLElement | null;
  wrapper: HTMLElement | null;
  cleanup: (() => void) | null;
};

type DomBlockWrapperOptions = {
  editor: Editor;
};

const ALLOWED_SELECTOR =
  "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre, table";

const isAllowedBlock = (el: Element | null): el is HTMLElement => {
  if (!el) return false;
  if (!(el instanceof HTMLElement)) return false;
  return el.matches(ALLOWED_SELECTOR);
};

const findBlockElement = (target: HTMLElement, editorDom: HTMLElement) => {
  let el: HTMLElement | null = target;
  while (el && el !== editorDom) {
    if (isAllowedBlock(el)) {
      return el;
    }

    if (el.classList.contains("memoir-block-wrapper")) {
      const childBlock = el.querySelector(ALLOWED_SELECTOR);
      if (childBlock && childBlock instanceof HTMLElement) {
        return childBlock;
      }
    }

    el = el.parentElement;
  }
  return null;
};

export const domBlockWrapperPlugin = ({ editor }: DomBlockWrapperOptions) => {
  return new Plugin({
    view: (view) => {
      const state: DomWrapperState = {
        block: null,
        wrapper: null,
        cleanup: null,
      };

      const unwrap = () => {
        if (!state.wrapper || !state.block) return;

        const parent = state.wrapper.parentNode;
        if (parent) {
          parent.insertBefore(state.block, state.wrapper);
          parent.removeChild(state.wrapper);
        }

        state.cleanup?.();
        state.wrapper = null;
        state.block = null;
        state.cleanup = null;
      };

      const wrapBlock = (block: HTMLElement) => {
        if (block.parentElement?.classList.contains("memoir-block-wrapper")) {
          state.block = block;
          state.wrapper = block.parentElement;
          return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "memoir-block-wrapper relative w-full group";
        wrapper.setAttribute("data-memoir-wrapper", "true");

        const handleSurface = document.createElement("div");
        handleSurface.className =
          "memoir-handle-surface absolute top-0 -left-12 hidden group-hover:flex items-start";
        handleSurface.setAttribute("contenteditable", "false");

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "memoir-handle-button";
        addButton.textContent = "+";
        addButton.setAttribute("aria-label", "Add block");
        addButton.setAttribute("data-memoir-handle", "plus");

        const onMouseDown = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
        };

        const onClick = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();

          const pos = view.posAtDOM(block, 0);
          if (pos === null || Number.isNaN(pos)) return;
          const targetPos = Math.min(pos + 1, view.state.doc.content.size);

          editor
            .chain()
            .focus()
            .setTextSelection(targetPos)
            .insertContent("/")
            .run();
        };

        addButton.addEventListener("mousedown", onMouseDown);
        addButton.addEventListener("click", onClick);

        handleSurface.appendChild(addButton);

        const parent = block.parentNode;
        if (!parent) return;

        parent.insertBefore(wrapper, block);
        wrapper.appendChild(handleSurface);
        wrapper.appendChild(block);

        state.block = block;
        state.wrapper = wrapper;
        state.cleanup = () => {
          addButton.removeEventListener("click", onClick);
          addButton.removeEventListener("mousedown", onMouseDown);
        };
      };

      const handleHover = (target: HTMLElement | null) => {
        if (!target) {
          unwrap();
          return;
        }

        const block = findBlockElement(target, view.dom as HTMLElement);
        if (!block) {
          unwrap();
          return;
        }

        if (block === state.block) {
          return;
        }

        unwrap();
        wrapBlock(block);
      };

      const onMouseMove = (event: MouseEvent) => {
        if (!(event.target instanceof HTMLElement)) return;
        handleHover(event.target);
      };

      const onMouseLeave = () => {
        unwrap();
      };

      view.dom.addEventListener("mousemove", onMouseMove);
      view.dom.addEventListener("mouseleave", onMouseLeave);

      const onBlur = () => {
        unwrap();
      };
      view.dom.addEventListener("blur", onBlur, true);

      return {
        destroy: () => {
          unwrap();
          view.dom.removeEventListener("mousemove", onMouseMove);
          view.dom.removeEventListener("mouseleave", onMouseLeave);
          view.dom.removeEventListener("blur", onBlur, true);
        },
      };
    },
  });
};
