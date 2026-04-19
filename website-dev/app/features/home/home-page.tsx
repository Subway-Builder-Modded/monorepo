import { HeroCarousel } from "@/app/features/home/components/hero-carousel";
import { PeopleSection } from "@/app/features/home/components/hub-sections";
import { OpenSourceSection } from "@/app/features/home/components/open-source-section";
import { AnalyticsSection } from "@/app/features/home/components/analytics-section";
import { SuiteScrollytellingSection } from "@/app/features/home/components/suite-scrollytelling";
import { ClosingBand } from "@/app/features/home/components/closing-band";

export function HomePage() {
  return (
    <>
      <HeroCarousel />
      <PeopleSection />
      <OpenSourceSection />
      <AnalyticsSection />
      <SuiteScrollytellingSection />
      <ClosingBand />
    </>
  );
}
