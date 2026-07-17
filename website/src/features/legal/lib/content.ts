import { createMdxRuntime } from "@subway-builder-modded/mdx";
import type { RawMdxModule } from "@/features/content/lib/mdx-virtual-module";

const mdxModules = import.meta.glob<RawMdxModule>("/content/license/*.mdx");
const registryMdxRuntime = createMdxRuntime();

function normalizeExplicitHeadingIds(source: string): string {
  return source.replace(
    /^(#{1,6})\s+(.+?)\s+\{#([A-Za-z0-9._-]+)\}\s*$/gm,
    (_match, hashes: string, title: string, id: string) =>
      `<h${hashes.length} id="${id}">${title}</h${hashes.length}>`,
  );
}

export async function loadLegalPage(sourcePath: string): Promise<React.ComponentType | null> {
  if (sourcePath.startsWith("/registry-cache/")) {
    try {
      const response = await fetch(sourcePath, { cache: "no-store" });
      if (!response.ok) return null;
      return registryMdxRuntime.evaluateMdx(normalizeExplicitHeadingIds(await response.text()));
    } catch {
      return null;
    }
  }

  const loader = mdxModules[sourcePath] as (() => Promise<RawMdxModule>) | undefined;
  if (!loader) return null;

  try {
    const module = await loader();
    return module.default;
  } catch {
    return null;
  }
}
