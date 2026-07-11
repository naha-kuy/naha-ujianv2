import React from "react";
import katex from "katex";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";

function MathNodeView({ node }) {
  const html = katex.renderToString(node.attrs.latex, {
    throwOnError: false,
    displayMode: false,
  });
  return (
    <NodeViewWrapper as="span" contentEditable={false}>
      <span dangerouslySetInnerHTML={{ __html: html }} style={{ display: "inline-block", verticalAlign: "middle" }} />
    </NodeViewWrapper>
  );
}

export const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return { latex: { default: "" } };
  },

  parseHTML() {
    return [{ tag: "span[data-math]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-math": node.attrs.latex }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathNodeView);
  },

  addCommands() {
    return {
      setMathInline:
        (latex) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: { latex } }),
    };
  },
});
