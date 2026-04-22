export const SITE_CONTENT_WIDTH_CLASS = 'mx-auto w-full';
// Keep desktop gutters fixed so navbar, footer, and content align consistently.
export const SITE_GUTTER_X_CLASS = 'px-5 sm:px-7 md:px-9 lg:px-12';
export const SITE_SHELL_CLASS = `${SITE_CONTENT_WIDTH_CLASS} ${SITE_GUTTER_X_CLASS}`;
export const SITE_MAIN_SPACING_CLASS =
  'py-[clamp(1rem,2.2vw,2rem)] md:py-[clamp(1.2rem,2.6vw,2.5rem)] min-[1920px]:py-[clamp(1.4rem,1.8vw,3rem)] min-[2560px]:py-[clamp(1.8rem,1.6vw,3.5rem)]';
export const SITE_SECTION_PADDING_TOP_CLASS =
  'pt-16 lg:pt-24 min-[1600px]:pt-28 min-[2200px]:pt-32 min-[2800px]:pt-36';
export const SITE_SECTION_PADDING_BOTTOM_CLASS =
  'pb-16 lg:pb-24 min-[1600px]:pb-28 min-[2200px]:pb-32 min-[2800px]:pb-36';
export const SITE_SECTION_SPACING_CLASS =
  `${SITE_SECTION_PADDING_TOP_CLASS} ${SITE_SECTION_PADDING_BOTTOM_CLASS}`;

export const APP_SHELL_WIDTH_CLASS = SITE_CONTENT_WIDTH_CLASS;
export const APP_SHELL_PADDING_CLASS = SITE_GUTTER_X_CLASS;
export const APP_SHELL_OUTER_CONTAINER_CLASS = SITE_SHELL_CLASS;
export const APP_CONTENT_SPACING_CLASS = SITE_MAIN_SPACING_CLASS;
