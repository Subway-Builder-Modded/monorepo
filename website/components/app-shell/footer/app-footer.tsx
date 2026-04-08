'use client';

import type { CSSProperties } from 'react';
import { Link } from '@/components/ui/link';
import { Avatar } from '@/components/ui/avatar';
import { AppIcon } from '@/components/shared/app-icon';
import {
  APP_FOOTER_UI_CONFIG,
  FOOTER_NAV_SECTIONS,
  FOOTER_SOCIAL_LINKS,
  getFooterNavColorScheme,
  type FooterNavColorSchemeId,
} from '@/config/navigation/footer';
import { SHARED_MUTED_TEXT_COLOR } from '@/config/theme/colors';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_LOGO_PATH,
} from '@/config/site/metadata';
import { hexAlpha } from '@/lib/color';

function getFooterRootVars(): CSSProperties {
  return {
    ['--footer-padding-x' as string]: APP_FOOTER_UI_CONFIG.layout.paddingX,
    ['--footer-padding-top' as string]: APP_FOOTER_UI_CONFIG.layout.paddingTop,
    ['--footer-padding-bottom' as string]:
      APP_FOOTER_UI_CONFIG.layout.paddingBottom,
    ['--footer-main-gap-y' as string]: APP_FOOTER_UI_CONFIG.layout.mainGapY,
    ['--footer-main-gap-x-desktop' as string]:
      APP_FOOTER_UI_CONFIG.layout.mainGapXDesktop,
    ['--footer-columns-gap-y' as string]:
      APP_FOOTER_UI_CONFIG.layout.columnsGapY,
    ['--footer-columns-gap-x-desktop' as string]:
      APP_FOOTER_UI_CONFIG.layout.columnsGapXDesktop,
    ['--footer-column-width' as string]:
      APP_FOOTER_UI_CONFIG.layout.columnWidthDesktop,
    ['--footer-section-title-mb' as string]:
      APP_FOOTER_UI_CONFIG.layout.sectionTitleMarginBottom,
    ['--footer-links-gap-y' as string]: APP_FOOTER_UI_CONFIG.layout.linksGapY,
    ['--footer-social-gap-x' as string]: APP_FOOTER_UI_CONFIG.layout.socialGapX,
    ['--footer-section-title-fs' as string]:
      APP_FOOTER_UI_CONFIG.typography.sectionTitleFontSize,
    ['--footer-section-title-ls' as string]:
      APP_FOOTER_UI_CONFIG.typography.sectionTitleLetterSpacing,
    ['--footer-link-fs' as string]:
      APP_FOOTER_UI_CONFIG.typography.linkFontSize,
    ['--footer-social-fs' as string]:
      APP_FOOTER_UI_CONFIG.typography.socialFontSize,
    ['--footer-section-icon' as string]:
      APP_FOOTER_UI_CONFIG.sizing.sectionIconSize,
    ['--footer-link-icon' as string]: APP_FOOTER_UI_CONFIG.sizing.linkIconSize,
    ['--footer-social-icon' as string]:
      APP_FOOTER_UI_CONFIG.sizing.socialIconSize,
    ['--footer-link-px' as string]: APP_FOOTER_UI_CONFIG.sizing.linkPaddingX,
    ['--footer-link-py' as string]: APP_FOOTER_UI_CONFIG.sizing.linkPaddingY,
    ['--footer-social-px' as string]:
      APP_FOOTER_UI_CONFIG.sizing.socialPaddingX,
    ['--footer-social-py' as string]:
      APP_FOOTER_UI_CONFIG.sizing.socialPaddingY,
    ['--footer-link-radius' as string]: APP_FOOTER_UI_CONFIG.sizing.linkRadius,
    ['--footer-social-radius' as string]:
      APP_FOOTER_UI_CONFIG.sizing.socialRadius,
    ['--footer-link-muted-light' as string]: SHARED_MUTED_TEXT_COLOR.light,
    ['--footer-link-muted-dark' as string]: SHARED_MUTED_TEXT_COLOR.dark,
  };
}

function getFooterSectionVars(
  sectionColorScheme: FooterNavColorSchemeId,
): CSSProperties {
  const scheme = getFooterNavColorScheme(sectionColorScheme);

  return {
    ['--footer-section-accent-light' as string]: scheme.accentColor.light,
    ['--footer-section-accent-dark' as string]: scheme.accentColor.dark,
    ['--footer-section-muted-light' as string]: scheme.mutedColor.light,
    ['--footer-section-muted-dark' as string]: scheme.mutedColor.dark,
    ['--footer-section-hover-bg-light' as string]: hexAlpha(
      scheme.accentColor.light,
      APP_FOOTER_UI_CONFIG.colors.hoverBgAlphaLight,
    ),
    ['--footer-section-hover-bg-dark' as string]: hexAlpha(
      scheme.accentColor.dark,
      APP_FOOTER_UI_CONFIG.colors.hoverBgAlphaDark,
    ),
  };
}

export default function AppFooter() {
  return (
    <footer
      data-color-scheme="default"
      className="pb-[var(--footer-padding-bottom)] pt-[var(--footer-padding-top)]"
      style={getFooterRootVars()}
    >
      <div className="px-[var(--footer-padding-x)]">
        <div className="grid gap-y-[var(--footer-main-gap-y)] md:grid-cols-[1fr_auto] md:gap-x-[var(--footer-main-gap-x-desktop)]">
          <div className="grid grid-cols-1 gap-y-[var(--footer-columns-gap-y)] sm:justify-start sm:[grid-template-columns:repeat(3,minmax(0,var(--footer-column-width)))] sm:gap-x-[var(--footer-columns-gap-x-desktop)]">
            {FOOTER_NAV_SECTIONS.map((section) => (
              <section
                key={section.id}
                style={getFooterSectionVars(section.colorScheme)}
              >
                <h3 className="mb-[var(--footer-section-title-mb)] flex items-center gap-1.5 text-[length:var(--footer-section-title-fs)] font-semibold tracking-[var(--footer-section-title-ls)] text-[var(--footer-section-accent-light)] dark:text-[var(--footer-section-accent-dark)]">
                  <AppIcon
                    icon={section.icon}
                    className="size-[var(--footer-section-icon)] shrink-0"
                  />
                  {section.title}
                </h3>
                <div className="flex flex-col gap-[var(--footer-links-gap-y)]">
                  {section.links.map((link) => (
                    <Link
                      key={link.id}
                      href={link.href}
                      className="flex items-center gap-2 rounded-[var(--footer-link-radius)] px-[var(--footer-link-px)] py-[var(--footer-link-py)] text-[length:var(--footer-link-fs)] font-medium text-[var(--footer-link-muted-light)] no-underline transition-colors hover:bg-[var(--footer-section-hover-bg-light)] hover:text-[var(--footer-section-accent-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--footer-section-accent-light)] dark:text-[var(--footer-link-muted-dark)] dark:hover:bg-[var(--footer-section-hover-bg-dark)] dark:hover:text-[var(--footer-section-accent-dark)] dark:focus-visible:ring-[var(--footer-section-accent-dark)]"
                    >
                      <AppIcon
                        icon={link.icon}
                        className="size-[var(--footer-link-icon)] shrink-0"
                      />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-foreground no-underline transition-colors hover:opacity-95 text-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar
                isSquare
                size="md"
                src={SITE_LOGO_PATH}
                className="border-0 shadow-none outline-hidden ring-0 [&_*]:border-0 [&_*]:shadow-none [&_*]:ring-0"
              />
              <span>{SITE_NAME}</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground md:text-right">
              {SITE_DESCRIPTION}
            </p>
            <div className="flex items-center gap-[var(--footer-social-gap-x)]">
              {FOOTER_SOCIAL_LINKS.map((social) => (
                <Link
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-[var(--footer-social-radius)] px-[var(--footer-social-px)] py-[var(--footer-social-py)] text-[length:var(--footer-social-fs)] font-semibold text-muted-foreground no-underline transition-colors hover:bg-accent/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <AppIcon
                    icon={social.icon}
                    className="size-[var(--footer-social-icon)] shrink-0"
                  />
                  {social.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="text-center text-sm text-muted-foreground">
            © {SITE_NAME} {new Date().getFullYear()}. Not affiliated with Subway
            Builder or Redistricter, LLC. All content is community-created and
            shared under appropriate licenses.
          </p>
        </div>
      </div>
    </footer>
  );
}
