import { Suspense, type ComponentType, useEffect, useState } from "react";
import { FileQuestion } from "lucide-react";

type AsyncMdxContentProps = {
  sourcePath: string;
  loadContent: (sourcePath: string) => Promise<ComponentType<any> | null>;
  components: Record<string, ComponentType<any>>;
  loadingLines?: number;
};

function ContentLoadingSkeleton({ lines }: { lines: number }) {
  const widths = ["w-3/4", "w-1/2", "w-5/6", "w-2/3", "w-4/5"] as const;

  return (
    <div className="space-y-4 py-8" aria-label="Loading article content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`h-4 animate-pulse rounded bg-muted/40 ${widths[index % widths.length]}`}
        />
      ))}
    </div>
  );
}

export function AsyncMdxContent({
  sourcePath,
  loadContent,
  components,
  loadingLines = 2,
}: AsyncMdxContentProps) {
  const [Content, setContent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContent(null);
    setError(null);

    loadContent(sourcePath)
      .then((component) => {
        if (cancelled) return;

        if (component) {
          setContent(() => component);
          return;
        }

        setError("Content not found");
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load content");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadContent, sourcePath]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <FileQuestion className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!Content) {
    return <ContentLoadingSkeleton lines={loadingLines} />;
  }

  return (
    <Suspense fallback={<ContentLoadingSkeleton lines={Math.max(2, loadingLines - 1)} />}>
      <Content components={components} />
    </Suspense>
  );
}
