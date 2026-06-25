import { isValidElement, type ReactElement, type ReactNode, useState, useCallback, useContext } from "react";
import { Check, Copy } from "lucide-react";
import { cx } from "../lib/cx.ts";
import { TabsVariantContext } from "./tabs.tsx";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  highlightLines?: string | number | number[];
  "data-highlight-lines"?: string | number | number[];
  "data-language"?: string;
};

type CodeElementProps = {
  children?: ReactNode;
  className?: string;
  title?: string;
  highlightLines?: string | number | number[];
  "data-highlight-lines"?: string | number | number[];
  "data-language"?: string;
};

function parseHighlightedLines(value: string | number | number[] | undefined) {
  const lines = new Set<number>();
  const raw = Array.isArray(value) ? value.join(",") : String(value ?? "");

  for (const part of raw.replace(/[{}]/g, "").split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      for (let line = Math.min(start, end); line <= Math.max(start, end); line += 1) {
        lines.add(line);
      }
      continue;
    }

    const line = Number(trimmed);
    if (Number.isInteger(line) && line > 0) {
      lines.add(line);
    }
  }

  return lines;
}

function getCodeElement(children: ReactNode) {
  return isValidElement<CodeElementProps>(children)
    ? (children as ReactElement<CodeElementProps>)
    : null;
}

function getLanguageFromClassName(className: string | undefined) {
  return className?.match(/(?:^|\s)language-([^\s]+)/)?.[1];
}

function stripFinalNewline(code: string) {
  return code.endsWith("\n") ? code.slice(0, -1) : code;
}

export function CodeBlock({
  children,
  className,
  title,
  highlightLines,
  "data-highlight-lines": dataHighlightLines,
  "data-language": lang,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tabsVariant = useContext(TabsVariantContext);
  const isEmbeddedInCodeTabs = tabsVariant === "code";
  const codeElement = getCodeElement(children);
  const codeProps = codeElement?.props;
  const codeText = typeof codeProps?.children === "string" ? stripFinalNewline(codeProps.children) : null;
  const resolvedTitle = title ?? codeProps?.title;
  const resolvedLang =
    lang ?? codeProps?.["data-language"] ?? getLanguageFromClassName(codeProps?.className);
  const resolvedHighlightLines =
    highlightLines ?? dataHighlightLines ?? codeProps?.highlightLines ?? codeProps?.["data-highlight-lines"];
  const highlightedLines = parseHighlightedLines(resolvedHighlightLines);
  const hasHighlightedLines = highlightedLines.size > 0 && codeText !== null;
  const renderedChildren =
    hasHighlightedLines && codeProps ? (
      <code className={codeProps.className}>
        {codeText.split("\n").map((line, index) => {
          const lineNumber = index + 1;
          const highlighted = highlightedLines.has(lineNumber);

          return (
            <span
              key={lineNumber}
              data-line={true}
              data-highlighted-line={highlighted ? true : undefined}
            >
              {line || "\u00A0"}
            </span>
          );
        })}
      </code>
    ) : (
      children
    );

  const handleCopy = useCallback(() => {
    if (typeof document === "undefined" || typeof navigator === "undefined") {
      return;
    }

    const pre = document.querySelector(`[data-code-id="${resolvedTitle ?? resolvedLang ?? "code"}"]`);
    const text = pre?.getAttribute("data-code-raw") ?? pre?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [resolvedTitle, resolvedLang]);

  return (
    <div
      className={cx(
        "group relative",
        isEmbeddedInCodeTabs
          ? "overflow-hidden rounded-b-xl"
          : "my-4 overflow-hidden rounded-lg border border-border/50 bg-card/95",
      )}
    >
      {!isEmbeddedInCodeTabs && (resolvedTitle || resolvedLang) ? (
        <div
          className={cx(
            "flex items-center justify-between border-b border-border/30 px-4 py-2",
            isEmbeddedInCodeTabs ? "bg-muted/35" : "bg-muted/45",
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">
            {resolvedTitle ?? resolvedLang}
          </span>
        </div>
      ) : null}
      <div className="relative">
        <pre
          data-code-id={resolvedTitle ?? resolvedLang ?? "code"}
          data-code-raw={codeText ?? undefined}
          className={cx(
            "overflow-x-hidden p-4 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "[&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[13px] [&_code]:whitespace-pre-wrap [&_code]:break-words [&_code]:[overflow-wrap:anywhere]",
            "[&_[data-line]]:block [&_[data-line]]:whitespace-pre-wrap [&_[data-line]]:break-words [&_[data-line]]:[overflow-wrap:anywhere]",
            "[&_[data-highlighted-line]]:-mx-4 [&_[data-highlighted-line]]:border-l-2 [&_[data-highlighted-line]]:border-[var(--registry-type-accent,var(--suite-accent-light))] [&_[data-highlighted-line]]:bg-[color-mix(in_srgb,var(--registry-type-accent,var(--suite-accent-light))_12%,transparent)] [&_[data-highlighted-line]]:px-[calc(1rem-2px)] dark:[&_[data-highlighted-line]]:border-[var(--registry-type-accent,var(--suite-accent-dark))] dark:[&_[data-highlighted-line]]:bg-[color-mix(in_srgb,var(--registry-type-accent,var(--suite-accent-dark))_16%,transparent)]",
            className,
          )}
        >
          {renderedChildren}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className={cx(
            "absolute right-2 top-2 rounded-md p-1.5 transition-all",
            "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
            "bg-foreground/10 hover:bg-foreground/20 text-foreground/60 hover:text-foreground/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={copied ? "Copied" : "Copy code"}
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden="true" />
          ) : (
            <Copy className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
