import { useLocation } from "@/lib/router";
import { matchTemplateModRoute } from "@/features/template-mod/lib/routing";
import { TemplateModPage } from "@/features/template-mod/template-mod-page";

export function TemplateModRoute() {
  const location = useLocation();
  const match = matchTemplateModRoute(location.pathname);

  if (match.kind !== "page") {
    return null;
  }

  return <TemplateModPage />;
}
