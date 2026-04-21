import { HeroCarousel } from "@/app/features/home/components/hero-carousel";
import { PeopleSection } from "@/app/features/home/components/hub-sections";
import { OpenSourceSection } from "@/app/features/home/components/open-source-section";
import { AnalyticsSection } from "@/app/features/home/components/analytics-section";
import { SuiteScrollytellingSection } from "@/app/features/home/components/suite-scrollytelling";

export function HomePage() {
  return (
    <div className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <HeroCarousel />
      <PeopleSection />
      <OpenSourceSection />
      <AnalyticsSection />
      <SuiteScrollytellingSection />
    </div>
  );
}
