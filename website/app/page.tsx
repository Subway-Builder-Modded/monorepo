import { HomeHeroBackground } from '@/features/home/components/home-hero-background';
import { HomeLinkButton } from '@/features/home/components/home-link-button';
import { HomeProjectCardView } from '@/features/home/components/home-project-card';
import {
  HomeSectionDivider,
  HomeSectionShell,
} from '@/features/home/components/home-sections';
import {
  HOME_CONTRIBUTE_SECTION,
  HOME_COMMUNITY_SECTION,
  HOME_HERO,
  HOME_OPEN_SOURCE_SECTION,
  HOME_PROJECT_SECTION,
  HOME_SUBWAY_BARS,
  HOME_THEME,
} from '@/config/site/homepage';

export default function Page() {
  return (
    <main
      className="relative min-h-screen text-foreground"
      style={{
        ['--home-accent-light' as string]: HOME_THEME.accent.light,
        ['--home-accent-dark' as string]: HOME_THEME.accent.dark,
      }}
    >
      <HomeHeroBackground
        lightSrc={HOME_HERO.backgroundImage.light}
        darkSrc={HOME_HERO.backgroundImage.dark}
        alt={HOME_HERO.backgroundImage.alt}
      />

      <section className="relative z-20 h-[calc(100svh-clamp(3.75rem,6vh,4.75rem))] overflow-hidden px-[clamp(0.85rem,3.5vw,2.4rem)] pt-[clamp(2.25rem,4.3vh,3.8rem)] pb-[clamp(0.45rem,1vh,0.85rem)] mb-[clamp(4rem,9vh,8.5rem)]">
        <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] gap-[clamp(0.4rem,1vh,0.75rem)] overflow-visible -translate-y-[clamp(0.6rem,1.8vh,1.5rem)]">
          <div className="relative z-30 flex min-h-0 items-center justify-center overflow-visible">
            <div className="relative z-30 flex w-full max-w-[min(92vw,45rem)] flex-col items-center text-center">
              <h1 className="text-balance text-[clamp(2rem,min(7.4vw,8.5svh),5.2rem)] font-black leading-[0.92] tracking-[-0.03em]">
                {HOME_HERO.title}
              </h1>

              <p className="mt-[clamp(0.6rem,1.8svh,1rem)] max-w-[36rem] text-pretty text-[clamp(0.98rem,min(2.2vw,2.4svh),1.18rem)] leading-[1.45] text-muted-foreground">
                {HOME_HERO.description}
              </p>

              <div className="mt-[clamp(0.75rem,2svh,1.1rem)] flex flex-wrap items-center justify-center gap-2">
                {HOME_SUBWAY_BARS.map((color) => (
                  <span
                    key={color}
                    className="h-1.5 w-[clamp(1.9rem,4vw,2.5rem)] rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                {HOME_HERO.primaryActions.map((action) => (
                  <HomeLinkButton key={action.label} link={action} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeSectionShell
        title={HOME_PROJECT_SECTION.title}
        description={HOME_PROJECT_SECTION.description}
      >
        <div className="flex flex-wrap items-stretch justify-center gap-5">
          {HOME_PROJECT_SECTION.cards.map((card) => (
            <HomeProjectCardView
              key={card.id}
              card={card}
              className="w-full max-w-[34rem] md:basis-[calc(50%-0.625rem)]"
            />
          ))}
        </div>
      </HomeSectionShell>

      <HomeSectionDivider />

      <HomeSectionShell
        title={HOME_OPEN_SOURCE_SECTION.title}
        description={HOME_OPEN_SOURCE_SECTION.description}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border/70 bg-card/70 p-5">
            <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
              {HOME_OPEN_SOURCE_SECTION.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black dark:bg-white" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 p-5">
            <div className="flex flex-col gap-2.5">
              {HOME_OPEN_SOURCE_SECTION.links.map((link) => (
                <HomeLinkButton key={link.label} link={link} />
              ))}
            </div>
          </div>
        </div>
      </HomeSectionShell>

      <HomeSectionDivider />

      <HomeSectionShell
        title={HOME_CONTRIBUTE_SECTION.title}
        description={HOME_CONTRIBUTE_SECTION.description}
      >
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border/70 bg-card/70 p-5">
            <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
              {HOME_CONTRIBUTE_SECTION.points.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-black dark:bg-white" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/70 p-5">
            <div className="flex flex-col gap-2.5">
              {HOME_CONTRIBUTE_SECTION.links.map((link) => (
                <HomeLinkButton key={link.label} link={link} />
              ))}
            </div>
          </div>
        </div>
      </HomeSectionShell>

      <HomeSectionDivider />

      <HomeSectionShell
        title={HOME_COMMUNITY_SECTION.title}
        description={HOME_COMMUNITY_SECTION.description}
      >
        <div className="flex flex-wrap items-center justify-start gap-3">
          {HOME_COMMUNITY_SECTION.links.map((link) => (
            <HomeLinkButton key={link.label} link={link} />
          ))}
        </div>
      </HomeSectionShell>

      <div className="h-16" />
    </main>
  );
}
