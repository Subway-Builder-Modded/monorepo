import { getRegistryTypeUiRules } from "@/features/registry/registry-type-ui";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";

function preloadImage(src: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const userAgent = window.navigator?.userAgent?.toLowerCase() ?? "";
  if (userAgent.includes("jsdom")) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const image = new Image();
    let isDone = false;
    const done = () => {
      if (isDone) {
        return;
      }
      isDone = true;
      clearTimeout(timeoutId);
      resolve();
    };
    image.onload = done;
    image.onerror = done;
    const timeoutId = window.setTimeout(done, 3000);
    image.src = src;

    if (image.complete) {
      done();
    }
  });
}

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    window.requestAnimationFrame(() => resolve());
  });
}

export async function preloadDetailTabAssets(detail: RegistryDetailModel): Promise<void> {
  const mapBasemapSrc = getRegistryTypeUiRules(detail.typeId).showBasemapBackground
    ? `/registry/${detail.routeSegment}/${detail.id}/basemap.svg`
    : null;

  const preloadTargets = [...detail.galleryImages, ...(mapBasemapSrc ? [mapBasemapSrc] : [])];

  await waitForNextFrame();
  await Promise.all(preloadTargets.map((imageSrc) => preloadImage(imageSrc)));
}
