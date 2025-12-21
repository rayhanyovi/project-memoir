import { InputRule, Node, mergeAttributes } from "@tiptap/core";

type MentionAttrs = {
  id: string | null;
  label: string | null;
};

const Mention = Node.create({
  name: "mention",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-mention]" }];
  },

  renderHTML({ node }) {
    const attrs = node.attrs as MentionAttrs;
    const label = attrs.label ?? attrs.id ?? "mention";

    return [
      "span",
      mergeAttributes({ "data-mention": "", class: "mention" }),
      `@${label}`,
    ];
  },

  addCommands() {
    return {
      insertMention:
        (attrs: MentionAttrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },

  addInputRules() {
    return [
      new InputRule({
        find: /@([\w.-]+)$/,
        handler: ({ match, range, commands }) => {
          const [, label] = match;
          commands.insertContentAt(range, {
            type: this.name,
            attrs: { id: label, label },
          });
        },
      }),
    ];
  },
});

export default Mention;
