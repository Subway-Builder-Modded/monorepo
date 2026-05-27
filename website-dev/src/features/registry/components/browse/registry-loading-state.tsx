import type { RegistryCardVariant } from "@/shared/registry-card/registry-item-types";

export function RegistryLoadingState({ cardVariant }: { cardVariant: RegistryCardVariant }) {
  const shells = Array.from({ length: 8 }, (_, i) => i);

  if (cardVariant === "list") {
    return (
      <div className="space-y-2">
        {shells.map((i) => (
          <div
            key={i}
            className="flex h-20 animate-pulse gap-4 rounded-xl border border-border/40 bg-card/60 p-3"
          >
            <div className="aspect-[4/3] w-24 rounded-lg bg-muted/40" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-1/3 rounded bg-muted/40" />
              <div className="h-3 w-1/2 rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cardVariant === "full") {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {shells.map((i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-2xl border border-border/40 bg-card/60"
          >
            <div className="w-full bg-muted/40 aspect-[16/9]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-24 rounded bg-muted/40" />
              <div className="h-6 w-4/5 rounded bg-muted/40" />
              <div className="h-4 w-1/2 rounded bg-muted/30" />
              <div className="space-y-1.5">
                <div className="h-4 w-full rounded bg-muted/30" />
                <div className="h-4 w-full rounded bg-muted/30" />
                <div className="h-4 w-11/12 rounded bg-muted/30" />
                <div className="h-4 w-10/12 rounded bg-muted/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 lg:grid-cols-3 xl:grid-cols-4">
      {shells.map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-border/40 bg-card/60"
        >
          <div className="w-full bg-muted/40 aspect-[16/8]" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-20 rounded bg-muted/40" />
            <div className="h-5 w-3/4 rounded bg-muted/40" />
            <div className="h-4 w-1/2 rounded bg-muted/30" />
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted/30" />
              <div className="h-3 w-5/6 rounded bg-muted/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
