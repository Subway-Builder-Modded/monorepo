export type ToolbarActionId =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "bold"
  | "italic"
  | "strike"
  | "inline-code"
  | "code-block"
  | "blockquote"
  | "bullet-list"
  | "numbered-list"
  | "link"
  | "image"
  | "horizontal-rule";

export type ToolbarActionResult = {
  content: string;
  selectionStart: number;
  selectionEnd: number;
};

type SelectionTransform = {
  prefix: string;
  suffix?: string;
  placeholder: string;
};

function wrapSelection(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  transform: SelectionTransform,
): ToolbarActionResult {
  const start = Math.max(0, Math.min(selectionStart, content.length));
  const end = Math.max(start, Math.min(selectionEnd, content.length));
  const selected = content.slice(start, end);
  const hasSelection = selected.length > 0;

  const textToInsert = `${transform.prefix}${hasSelection ? selected : transform.placeholder}${transform.suffix ?? ""}`;
  const nextContent = `${content.slice(0, start)}${textToInsert}${content.slice(end)}`;

  if (hasSelection) {
    return {
      content: nextContent,
      selectionStart: start,
      selectionEnd: start + textToInsert.length,
    };
  }

  const placeholderStart = start + transform.prefix.length;
  const placeholderEnd = placeholderStart + transform.placeholder.length;

  return {
    content: nextContent,
    selectionStart: placeholderStart,
    selectionEnd: placeholderEnd,
  };
}

function insertAtLineStart(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
  placeholder: string,
): ToolbarActionResult {
  const start = Math.max(0, Math.min(selectionStart, content.length));
  const end = Math.max(start, Math.min(selectionEnd, content.length));

  if (start === end) {
    const insertion = `${marker} ${placeholder}`;
    const nextContent = `${content.slice(0, start)}${insertion}${content.slice(end)}`;
    return {
      content: nextContent,
      selectionStart: start + marker.length + 1,
      selectionEnd: start + insertion.length,
    };
  }

  const lineStart = content.lastIndexOf("\n", start - 1) + 1;
  const lineEndFromSelection = content.indexOf("\n", end);
  const lineEnd = lineEndFromSelection === -1 ? content.length : lineEndFromSelection;
  const block = content.slice(lineStart, lineEnd);
  const transformedBlock = block
    .split("\n")
    .map((line) => `${marker} ${line}`)
    .join("\n");

  const nextContent = `${content.slice(0, lineStart)}${transformedBlock}${content.slice(lineEnd)}`;
  return {
    content: nextContent,
    selectionStart: lineStart,
    selectionEnd: lineStart + transformedBlock.length,
  };
}

function linePrefix(
  content: string,
  selectionStart: number,
  selectionEnd: number,
  marker: string,
  placeholder: string,
): ToolbarActionResult {
  return insertAtLineStart(content, selectionStart, selectionEnd, marker, placeholder);
}

export function applyToolbarAction(
  actionId: ToolbarActionId,
  content: string,
  selectionStart: number,
  selectionEnd: number,
): ToolbarActionResult {
  switch (actionId) {
    case "h1":
      return insertAtLineStart(content, selectionStart, selectionEnd, "#", "Heading 1");
    case "h2":
      return insertAtLineStart(content, selectionStart, selectionEnd, "##", "Heading 2");
    case "h3":
      return insertAtLineStart(content, selectionStart, selectionEnd, "###", "Heading 3");
    case "h4":
      return insertAtLineStart(content, selectionStart, selectionEnd, "####", "Heading 4");
    case "bold":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "**",
        suffix: "**",
        placeholder: "bold text",
      });
    case "italic":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "*",
        suffix: "*",
        placeholder: "italic text",
      });
    case "strike":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "~~",
        suffix: "~~",
        placeholder: "strikethrough",
      });
    case "inline-code":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "`",
        suffix: "`",
        placeholder: "code",
      });
    case "code-block": {
      const start = Math.max(0, Math.min(selectionStart, content.length));
      const end = Math.max(start, Math.min(selectionEnd, content.length));
      const selected = content.slice(start, end);
      const body = selected || "// code";
      const insertion = `\n\`\`\`ts\n${body}\n\`\`\`\n`;
      const nextContent = `${content.slice(0, start)}${insertion}${content.slice(end)}`;
      const bodyStart = start + "\n```ts\n".length;
      return {
        content: nextContent,
        selectionStart: bodyStart,
        selectionEnd: bodyStart + body.length,
      };
    }
    case "blockquote":
      return linePrefix(content, selectionStart, selectionEnd, ">", "Quoted text");
    case "bullet-list":
      return linePrefix(content, selectionStart, selectionEnd, "-", "List item");
    case "numbered-list":
      return linePrefix(content, selectionStart, selectionEnd, "1.", "List item");
    case "link":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "[",
        suffix: "](https://example.com)",
        placeholder: "Link text",
      });
    case "image":
      return wrapSelection(content, selectionStart, selectionEnd, {
        prefix: "![",
        suffix: "](https://example.com/image.png)",
        placeholder: "Alt text",
      });
    case "horizontal-rule": {
      const start = Math.max(0, Math.min(selectionStart, content.length));
      const insertion = "\n---\n";
      const nextContent = `${content.slice(0, start)}${insertion}${content.slice(start)}`;
      return {
        content: nextContent,
        selectionStart: start + insertion.length,
        selectionEnd: start + insertion.length,
      };
    }
    default:
      return { content, selectionStart, selectionEnd };
  }
}
