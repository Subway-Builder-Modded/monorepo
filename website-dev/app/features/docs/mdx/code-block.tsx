import { type ReactNode, useState, useCallback, useContext } from "react";
import { cn } from "@/app/lib/utils";
import { Check, Copy } from "lucide-react";
import { TabsVariantContext } from "./tabs";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  "data-language"?: string;
};

export function CodeBlock({ children, className, title, "data-language": lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const tabsVariant = useContext(TabsVariantContext);
  const isEmbeddedInCodeTabs = tabsVariant === "code";

  const handleCopy = useCallback(() => {
    const pre = document.querySelector(`[data-code-id="${title ?? lang ?? "code"}"]`);
    const text = pre?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [title, lang]);

  return (
    <div
      className={cn(
        "group relative",
        isEmbeddedInCodeTabs
          ? "overflow-hidden rounded-b-xl"
          : "my-4 overflow-hidden rounded-lg border border-border/50 bg-card/95",
      )}
    >
      {!isEmbeddedInCodeTabs && (title || lang) ? (
        <div
          className={cn(
            "flex items-center justify-between border-b border-border/30 px-4 py-2",
            isEmbeddedInCodeTabs ? "bg-muted/35" : "bg-muted/45",
          )}
        >
          <span className="text-xs font-medium text-muted-foreground">{title ?? lang}</span>
        </div>
      ) : null}
      <div className="relative">
        <pre
          data-code-id={title ?? lang ?? "code"}
          className={cn(
            "overflow-x-hidden p-4 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
            "[&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[13px] [&_code]:whitespace-pre-wrap [&_code]:break-words [&_code]:[overflow-wrap:anywhere]",
            "[&_[data-line]]:whitespace-pre-wrap [&_[data-line]]:break-words [&_[data-line]]:[overflow-wrap:anywhere]",
            className,
          )}
        >
          {children}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className={cn(
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
