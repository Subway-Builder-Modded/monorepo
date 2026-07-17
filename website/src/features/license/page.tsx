import { LegalPage } from "@/features/legal/components/legal-page";
import { loadLicensePage } from "@/features/license/lib/content";

export function LicenseRoute() {
  return (
    <LegalPage
      routePath="/license"
      sourcePath="/content/license/gpl-3.0.mdx"
      loadContent={loadLicensePage}
    />
  );
}
