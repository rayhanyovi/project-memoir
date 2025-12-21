import type { Editor } from "@tiptap/core";
import { Plugin, TextSelection } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";

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

const isTopLevelBlock = (block: HTMLElement, editorDom: HTMLElement) => {
  if (block.tagName === "LI") {
    return editorDom.contains(block);
  }
  return block.parentElement === editorDom;
};

const stopObserver = (view: { domObserver?: { stop?: () => void } }) => {
  view.domObserver?.stop?.();
};

const startObserver = (view: { domObserver?: { start?: () => void } }) => {
  view.domObserver?.start?.();
};

const createWrapper = () => {
  const wrapper = document.createElement("div");
  wrapper.className = "memoir-block-wrapper relative w-full group";
  wrapper.setAttribute("data-memoir-wrapper", "true");
  return wrapper;
};

const createHandleSurface = () => {
  const surface = document.createElement("div");
  surface.className =
    "memoir-handle-surface absolute top-0 -left-12 flex items-start";
  surface.setAttribute("contenteditable", "false");
  return surface;
};

const ensureHandle = (wrapper: HTMLElement, block: HTMLElement, view: EditorView) => {
  let surface = wrapper.querySelector(
    ":scope > .memoir-handle-surface"
  ) as HTMLDivElement | null;
  if (!surface) {
    surface = createHandleSurface();
    wrapper.insertBefore(surface, wrapper.firstChild);
  }

  let addButton = surface.querySelector(
    '[data-memoir-handle="plus"]'
  ) as HTMLButtonElement | null;
  if (!addButton) {
    addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "memoir-handle-button";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", "Add block");
    addButton.setAttribute("data-memoir-handle", "plus");
    surface.appendChild(addButton);
  }

  let dragButton = surface.querySelector(
    '[data-memoir-handle="drag"]'
  ) as HTMLButtonElement | null;
  if (!dragButton) {
    dragButton = document.createElement("button");
    dragButton.type = "button";
    dragButton.className = "memoir-handle-button memoir-handle-drag";
    dragButton.textContent = "⋮⋮";
    dragButton.setAttribute("aria-label", "Drag block");
    dragButton.setAttribute("data-memoir-handle", "drag");
    dragButton.draggable = true;
    surface.appendChild(dragButton);
  }

  const pos = view.posAtDOM(block, 0);
  if (pos !== null && !Number.isNaN(pos)) {
    dragButton.dataset.from = pos.toString();
  } else {
    dragButton.removeAttribute("data-from");
  }
};

const wrapBlock = (block: HTMLElement, view: EditorView) => {
  if (block.closest(".memoir-block-wrapper")) {
    return;
  }

  if (block.tagName === "LI") {
    const li = block as HTMLLIElement;
    if (li.querySelector(":scope > .memoir-block-wrapper")) {
      return;
    }
    const wrapper = createWrapper();
    const children = Array.from(li.childNodes);
    children.forEach((child) => wrapper.appendChild(child));
    li.appendChild(wrapper);
    ensureHandle(wrapper, li, view);
    return;
  }

  const parent = block.parentElement;
  if (!parent) {
    return;
  }
  const wrapper = createWrapper();
  parent.insertBefore(wrapper, block);
  wrapper.appendChild(block);
  ensureHandle(wrapper, block, view);
};

const cleanupWrappers = (editorDom: HTMLElement) => {
  const wrappers = Array.from(
    editorDom.querySelectorAll(".memoir-block-wrapper")
  ) as HTMLElement[];
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentElement;
    if (!parent) {
      wrapper.remove();
      return;
    }
    if (parent.tagName === "LI") {
      const hasContent = Array.from(wrapper.childNodes).some((child) => {
        return !(
          child instanceof HTMLElement &&
          child.classList.contains("memoir-handle-surface")
        );
      });
      if (!hasContent) {
        wrapper.remove();
      }
      return;
    }
    const block = wrapper.querySelector(ALLOWED_SELECTOR);
    if (!block) {
      wrapper.remove();
    }
  });
};

const unwrapAll = (editorDom: HTMLElement) => {
  const wrappers = Array.from(
    editorDom.querySelectorAll(".memoir-block-wrapper")
  ) as HTMLElement[];
  wrappers.forEach((wrapper) => {
    const parent = wrapper.parentElement;
    if (!parent) {
      wrapper.remove();
      return;
    }
    if (parent.tagName === "LI") {
      const children = Array.from(wrapper.childNodes);
      children.forEach((child) => {
        if (
          child instanceof HTMLElement &&
          child.classList.contains("memoir-handle-surface")
        ) {
          return;
        }
        parent.insertBefore(child, wrapper);
      });
      wrapper.remove();
      return;
    }
    const block = wrapper.querySelector(ALLOWED_SELECTOR);
    if (block) {
      parent.insertBefore(block, wrapper);
    }
    wrapper.remove();
  });
};

export const domBlockWrapperPlugin = ({ editor }: DomBlockWrapperOptions) => {
  return new Plugin({
    view: (view) => {
      const dom = view.dom as HTMLElement;

      const syncWrappers = () => {
        stopObserver(view as any);
        cleanupWrappers(dom);
        const blocks = Array.from(dom.querySelectorAll(ALLOWED_SELECTOR)) as HTMLElement[];
        blocks.forEach((block) => {
          if (!isTopLevelBlock(block, dom)) {
            return;
          }
          wrapBlock(block, view);
        });
        startObserver(view as any);
      };

      const handleMouseDown = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        if (target.closest(".memoir-handle-button")) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      const handleClick = (event: MouseEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }
        const button = target.closest(
          ".memoir-handle-button"
        ) as HTMLButtonElement | null;
        if (!button) {
          return;
        }
        const action = button.getAttribute("data-memoir-handle");
        if (action !== "plus") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        const wrapper = button.closest(".memoir-block-wrapper");
        if (!(wrapper instanceof HTMLElement)) {
          return;
        }
        const block =
          wrapper.parentElement?.tagName === "LI"
            ? wrapper.parentElement
            : wrapper.querySelector(ALLOWED_SELECTOR);
        if (!(block instanceof HTMLElement)) {
          return;
        }
        const pos = view.posAtDOM(block, 0);
        if (pos === null || Number.isNaN(pos)) {
          return;
        }
        const selectionPos = Math.min(
          pos + 1,
          view.state.doc.content.size
        );
        const tr = view.state.tr
          .setSelection(TextSelection.create(view.state.doc, selectionPos))
          .insertText("/");
        view.dispatch(tr);
        view.focus();
      };

      dom.addEventListener("mousedown", handleMouseDown);
      dom.addEventListener("click", handleClick);
      syncWrappers();

      return {
        update: () => {
          syncWrappers();
        },
        destroy: () => {
          dom.removeEventListener("mousedown", handleMouseDown);
          dom.removeEventListener("click", handleClick);
          stopObserver(view as any);
          unwrapAll(dom);
          startObserver(view as any);
        },
      };
    },
  });
};
