import { memo } from "react";
import { cn } from "@/lib/utils";

type MdxRenderedHtmlProps = {
  html: string;
  className?: string;
  testId?: string;
  dir?: "ltr" | "rtl";
};

export const MDX_RENDERED_HTML_CLASS = cn(
  "prose-docs max-w-none text-sm leading-7 prose-headings:font-semibold",
  "[&>*:first-child]:mt-0",
  "[&>*:last-child]:mb-0",
  "[&_a]:!text-[var(--registry-type-accent)] [&_a]:underline [&_a]:underline-offset-2",
  "[&_a:visited]:!text-[var(--registry-type-accent)]",
  "[&_h1_a]:!text-inherit [&_h1_a]:no-underline [&_h1_a:hover]:underline",
  "[&_h1_a:visited]:!text-inherit",
  "[&_h2_a]:!text-inherit [&_h2_a]:no-underline [&_h2_a:hover]:underline",
  "[&_h2_a:visited]:!text-inherit",
  "[&_h3_a]:!text-inherit [&_h3_a]:no-underline [&_h3_a:hover]:underline",
  "[&_h3_a:visited]:!text-inherit",
  "[&_h4_a]:!text-inherit [&_h4_a]:no-underline [&_h4_a:hover]:underline",
  "[&_h4_a:visited]:!text-inherit",
  "[&_h5_a]:!text-inherit [&_h5_a]:no-underline [&_h5_a:hover]:underline",
  "[&_h5_a:visited]:!text-inherit",
  "[&_h2]:scroll-mt-24",
);

export const MdxRenderedHtml = memo(function MdxRenderedHtml({
  html,
  className,
  testId,
  dir = "ltr",
}: MdxRenderedHtmlProps) {
  return (
    <div
      dir={dir}
      className={cn(MDX_RENDERED_HTML_CLASS, className)}
      dangerouslySetInnerHTML={{ __html: html }}
      data-testid={testId}
    />
  );
});
