import { visit } from 'unist-util-visit';

const DIRECTIVE_COMPONENT_MAP: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
  danger: 'Danger',
  info: 'Info',
  success: 'Success',
  deprecated: 'Deprecated',
  bug: 'Bug',
  example: 'Example',
  announcement: 'Announcement',
  tabs: 'Tabs',
  tab: 'Tab',
};

type DirectiveAttributeValue = string | boolean | null | undefined;

type GenericNode = {
  type: string;
  [key: string]: unknown;
};

type DirectiveNode = GenericNode & {
  type: 'containerDirective' | 'leafDirective' | 'textDirective';
  name?: string;
  label?: string;
  attributes?: Record<string, DirectiveAttributeValue>;
};

type MdxJsxAttributeNode = {
  type: 'mdxJsxAttribute';
  name: string;
  value: string | boolean;
};

type MdxJsxFlowElementNode = GenericNode & {
  type: 'mdxJsxFlowElement';
  name: string;
  attributes: MdxJsxAttributeNode[];
};

function isDirectiveNode(node: GenericNode): node is DirectiveNode {
  return (
    node.type === 'containerDirective' ||
    node.type === 'leafDirective' ||
    node.type === 'textDirective'
  );
}

function extractTitle(node: DirectiveNode) {
  if (node.label) return node.label;
  if (node.attributes?.title) return node.attributes.title;
  if (node.attributes?.label) return node.attributes.label;
  return null;
}

function hasFlag(node: DirectiveNode, flag: string) {
  const attrs = node.attributes ?? {};
  return attrs[flag] === '' || attrs[flag] === true || attrs[flag] === 'true';
}

export default function remarkAdmonitionDirectives() {
  return (tree: GenericNode) => {
    visit(tree, (node) => {
      if (!isDirectiveNode(node)) return;

      const directiveName = typeof node.name === 'string' ? node.name : '';
      const componentName = DIRECTIVE_COMPONENT_MAP[directiveName];
      if (!componentName) return;

      const title = extractTitle(node);
      const attributes: MdxJsxAttributeNode[] = [];

      if (title) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'title',
          value: title,
        });
      }

      if (node.attributes?.id) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'id',
          value: node.attributes.id,
        });
      }

      if (node.attributes?.class) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'className',
          value: node.attributes.class,
        });
      }

      if (componentName !== 'Tabs' && componentName !== 'Tab') {
        if (hasFlag(node, 'collapsible')) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'collapsible',
            value: true,
          });
        }

        if (
          node.attributes?.defaultOpen === 'false' ||
          node.attributes?.open === 'false'
        ) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'defaultOpen',
            value: false,
          });
        }
      }

      if (componentName === 'Tab' && title) {
        attributes.push({
          type: 'mdxJsxAttribute',
          name: 'label',
          value: title,
        });
      }

      const mdxNode = node as unknown as MdxJsxFlowElementNode;
      mdxNode.type = 'mdxJsxFlowElement';
      mdxNode.name = componentName;
      mdxNode.attributes = attributes;
    });
  };
}
