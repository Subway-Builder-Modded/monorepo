import { type ReactNode, useState, useCallback } from "react";
import { cn } from "@/app/lib/utils";
import { Check, Copy } from "lucide-react";

type CodeBlockProps = {
  children: ReactNode;
  className?: string;
  title?: string;
  "data-language"?: string;
};

export function CodeBlock({ children, className, title, "data-language": lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const pre = document.querySelector(`[data-code-id="${title ?? lang ?? "code"}"]`);
    const text = pre?.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [title, lang]);

  return (
    <div className="group relative my-4 overflow-hidden rounded-lg border border-border/50 bg-[#0d1117] dark:bg-[#0d1117]">
      {(title || lang) && (
        <div className="flex items-center justify-between border-b border-border/30 bg-[#161b22] px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">{title ?? lang}</span>
        </div>
      )}
      <div className="relative">
        <pre
          data-code-id={title ?? lang ?? "code"}
          className={cn(
            "overflow-x-auto p-4 text-sm leading-relaxed",
            "[&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[13px]",
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
            "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white/90",
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
