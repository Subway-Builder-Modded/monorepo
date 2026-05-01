import { useEffect, useMemo } from "react";
import { resolvePageMetadata } from "@/config/page-metadata";
import { normalizeBasePath } from "@/lib/router";

type UsePageMetadataOptions = {
  pathname: string;
};

function withBasePath(pathname: string): string {
  const basePath = normalizeBasePath(import.meta.env.BASE_URL ?? "/");
  if (basePath === "/") {
    return pathname;
  }

  if (pathname === "/") {
    return basePath;
  }

  return `${basePath}${pathname}`;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

export function usePageMetadata({ pathname }: UsePageMetadataOptions) {
  const metadata = useMemo(() => resolvePageMetadata(pathname), [pathname]);

  useEffect(() => {
    const basePathname = withBasePath(metadata.pathname);
    const absoluteUrl = new URL(basePathname, window.location.origin).toString();
    const absoluteImageUrl = new URL(
      withBasePath(metadata.imagePath),
      window.location.origin,
    ).toString();

    document.title = metadata.pageTitle;

    upsertMeta("name", "description", metadata.description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:title", metadata.pageTitle);
    upsertMeta("property", "og:description", metadata.description);
    upsertMeta("property", "og:image", absoluteImageUrl);
    upsertMeta("property", "og:url", absoluteUrl);
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", metadata.pageTitle);
    upsertMeta("name", "twitter:description", metadata.description);
    upsertMeta("name", "twitter:image", absoluteImageUrl);
    upsertLink("canonical", absoluteUrl);
  }, [metadata]);

  return metadata;
}
