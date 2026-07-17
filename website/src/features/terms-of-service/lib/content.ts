import { loadLegalPage } from "@/features/legal/lib/content";

const TERMS_OF_SERVICE_CONTENT_PATH = "/registry-cache/docs/terms-of-service.mdx";

export function loadTermsOfServicePage(): Promise<React.ComponentType | null> {
  return loadLegalPage(TERMS_OF_SERVICE_CONTENT_PATH);
}
