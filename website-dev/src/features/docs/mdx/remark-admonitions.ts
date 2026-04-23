/**
 * Remark plugin that converts directive syntax (:::note, :::tip[Title], etc.)
 * into JSX admonition components compatible with our MDX registry.
 */
import type { Root, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "warning",
  "caution",
  "danger",
  "info",
  "success",
  "deprecated",
  "alert",
  "example",
  "announcement",
]);

const TYPE_TO_COMPONENT: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  danger: "Danger",
  info: "InfoAdmonition",
  success: "Success",
  deprecated: "Deprecated",
  alert: "Alert",
  example: "Example",
  announcement: "Announcement",
};

interface DirectiveNode extends Parent {
  type: "containerDirective" | "leafDirective" | "textDirective";
  name: string;
  attributes?: Record<string, string>;
  data?: Record<string, unknown>;
  children: Parent["children"];
}

function isDirectiveNode(node: unknown): node is DirectiveNode {
  if (!node || typeof node !== "object") return false;
  const n = node as { type?: string };
  return (
    n.type === "containerDirective" || n.type === "leafDirective" || n.type === "textDirective"
  );
}

export const remarkAdmonitionDirectives: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, (node: unknown) => {
      if (!isDirectiveNode(node)) return;
      if (node.type !== "containerDirective") return;

      const typeName = node.name.toLowerCase();
      if (!ADMONITION_TYPES.has(typeName)) return;

      const componentName = TYPE_TO_COMPONENT[typeName] ?? "Note";

      // Extract title from label attribute or first text child
      let title: string | undefined;

      // Check for [title] syntax — remark-directive puts it in node.children[0]
      // as a paragraph with data.directiveLabel = true
      const firstChild = node.children[0];
      if (
        firstChild &&
        "data" in firstChild &&
        (firstChild as { data?: { directiveLabel?: boolean } }).data?.directiveLabel
      ) {
        // Extract text from the label paragraph
        const labelParagraph = firstChild as Parent;
        title = extractText(labelParagraph);
        // Remove the label from children
        node.children = node.children.slice(1);
      }

      // Also check attributes for title/label
      if (!title && node.attributes) {
        title = node.attributes.title ?? node.attributes.label;
      }

      // Build JSX attributes
      const attributes: Array<{
        type: "mdxJsxAttribute";
        name: string;
        value: string;
      }> = [];

      if (title) {
        attributes.push({
          type: "mdxJsxAttribute",
          name: "title",
          value: title,
        });
      }

      // Convert to mdxJsxFlowElement
      const data = node.data ?? (node.data = {});
      data.hName = componentName;

      // Replace the node type
      Object.assign(node, {
        type: "mdxJsxFlowElement",
        name: componentName,
        attributes,
        children: node.children,
      });
    });
  };
};

function extractText(node: Parent): string {
  let text = "";
  for (const child of node.children) {
    if ("value" in child && typeof (child as { value?: string }).value === "string") {
      text += (child as { value: string }).value;
    } else if ("children" in child) {
      text += extractText(child as Parent);
    }
  }
  return text;
}
