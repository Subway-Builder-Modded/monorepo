import { loadLegalPage } from "@/features/legal/lib/content";

const LICENSE_CONTENT_PATH = "/content/license/gpl-3.0.mdx";

export async function loadLicensePage(): Promise<React.ComponentType | null> {
  return loadLegalPage(LICENSE_CONTENT_PATH);
}
