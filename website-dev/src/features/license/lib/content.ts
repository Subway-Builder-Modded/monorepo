import type { RawMdxModule } from "@/features/content/lib/mdx-virtual-module";

const mdxModules = import.meta.glob<RawMdxModule>("/content/license/*.mdx");

const LICENSE_CONTENT_PATH = "/content/license/gpl-3.0.mdx";

export async function loadLicensePage(): Promise<React.ComponentType | null> {
  const loader = mdxModules[LICENSE_CONTENT_PATH] as (() => Promise<RawMdxModule>) | undefined;
  if (!loader) {
    return null;
  }

  try {
    const module = await loader();
    return module.default;
  } catch {
    return null;
  }
}
