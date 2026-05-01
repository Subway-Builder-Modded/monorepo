import { type ReactNode, useContext } from "react";
import { createArticleMdxComponents } from "@subway-builder-modded/mdx";
import { Link } from "@/lib/router";
import { resolveIcon } from "@subway-builder-modded/icons";
import {
  ChangelogBulletContext,
  ChangelogSection,
} from "@/features/updates/mdx/changelog-sections";
import { Directory } from "@/features/updates/mdx/directory";

const baseArticleMdxComponents = createArticleMdxComponents({
  internalLinkComponent: Link,
  resolveIcon,
});

// MDX component map requires a string-keyed record per the MDX runtime API.
// The `any` cast is an intentional boundary where component prop typing is applied per component.
export const articleMdxComponents: Record<string, React.ComponentType<any>> = {
  ...baseArticleMdxComponents,
  ul: function MdxUl({ children, ...props }) {
    const bullet = useContext(ChangelogBulletContext);
    if (bullet) {
      return (
        <ul
          className="my-1 ml-5 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground"
          {...props}
        >
          {children as ReactNode}
        </ul>
      );
    }

    return (
      <ul
        className="my-3 ml-6 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground"
        {...props}
      >
        {children as ReactNode}
      </ul>
    );
  },
  li: function MdxLi({ children, ...props }) {
    const bullet = useContext(ChangelogBulletContext);
    if (bullet) {
      return (
        <li className="leading-relaxed" {...props}>
          {children as ReactNode}
        </li>
      );
    }

    return (
      <li className="leading-relaxed" {...props}>
        {children as ReactNode}
      </li>
    );
  },
  ChangelogSection: ChangelogSection as React.ComponentType<Record<string, unknown>>,
  Directory: Directory as React.ComponentType<Record<string, unknown>>,
} as Record<string, React.ComponentType<any>>;
