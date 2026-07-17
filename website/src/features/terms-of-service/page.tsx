import { LegalPage } from "@/features/legal/components/legal-page";
import { loadTermsOfServicePage } from "@/features/terms-of-service/lib/content";

export function TermsOfServiceRoute() {
  return (
    <LegalPage
      routePath="/terms-of-service"
      sourcePath="/registry-cache/docs/terms-of-service.mdx"
      loadContent={loadTermsOfServicePage}
    />
  );
}
