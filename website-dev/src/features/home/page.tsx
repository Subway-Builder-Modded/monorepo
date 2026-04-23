import { HeroCarousel } from "@/features/home/components/hero-carousel";
import { PeopleSection } from "@/features/home/components/hub-sections";
import { OpenSourceSection } from "@/features/home/components/open-source-section";
import { AnalyticsSection } from "@/features/home/components/analytics-section";
import { SuiteScrollytellingSection } from "@/features/home/components/suite-scrollytelling";

export default function HomePage() {
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
