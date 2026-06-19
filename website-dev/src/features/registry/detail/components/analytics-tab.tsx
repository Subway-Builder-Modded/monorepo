import { SectionSeparator } from "@subway-builder-modded/shared-ui";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { getAnalyticsTabSections } from "@/features/registry/detail/config/analytics-tab-config";
import { DetailsMetricGrid } from "@/features/registry/detail/components/details-tab";

type AnalyticsTabProps = {
  detail: RegistryDetailModel;
};

export function AnalyticsTab({ detail }: AnalyticsTabProps) {
  const sections = getAnalyticsTabSections(detail);

  if (sections.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      {sections.map((section, index) => (
        <div key={`${section.title}-${index}`}>
          <SectionSeparator
            label={section.title}
            icon={section.icon}
            className={index === 0 ? "mb-4" : "mb-4 mt-7"}
          />
          <DetailsMetricGrid
            className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
            items={section.cards}
            accentLight={detail.typeConfig.accentLight}
            accentDark={detail.typeConfig.accentDark}
          />
        </div>
      ))}
    </section>
  );
}
