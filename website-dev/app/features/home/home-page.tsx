import { HeroCarousel } from "@/app/features/home/components/hero-carousel";
import {
  CommunityHubSection,
  CreditsContributeHubSection,
  OpenSourceHubSection,
} from "@/app/features/home/components/hub-sections";
import { SuiteScrollytellingSection } from "@/app/features/home/components/suite-scrollytelling";
import { ClosingBand } from "@/app/features/home/components/closing-band";

export function HomePage() {
  return (
    <>
      {/* 1 — Full-bleed hero */}
      <HeroCarousel />

      {/* 2A — Community */}
      <CommunityHubSection />

      {/* 2B — Credits + Contribute */}
      <CreditsContributeHubSection />

      {/* 2C — Open Source + Analytics */}
      <OpenSourceHubSection />

      {/* 3 — Suite scrollytelling */}
      <SuiteScrollytellingSection />

      {/* 4 — Closing band */}
      <ClosingBand />
    </>
  );
}
