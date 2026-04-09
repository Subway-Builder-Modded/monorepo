/**
 * Maximum content width with a fluid clamp to viewport edge.
 * Apply to the outermost wrapper of each page-level layout.
 */
export const APP_SHELL_WIDTH_CLASS =
  'mx-auto w-[min(1840px,calc(100vw-1.5rem))]';

/**
 * Fluid horizontal padding that grows from 1 rem to 2.5 rem with viewport.
 */
export const APP_SHELL_PADDING_CLASS = 'px-[clamp(1rem,2.8vw,2.5rem)]';

/**
 * Fluid vertical spacing for main page content areas.
 */
export const APP_CONTENT_SPACING_CLASS =
  'py-[clamp(1rem,2.4vw,2rem)] md:py-[clamp(1.25rem,2.8vw,2.5rem)]';
