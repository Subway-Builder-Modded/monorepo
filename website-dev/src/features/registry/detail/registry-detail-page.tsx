import { useEffect, useMemo, useState } from "react";
import { SuiteAccentScope } from "@subway-builder-modded/shared-ui";
import { getSuiteById } from "@/config/site-navigation";
import { NotFoundPage } from "@/features/not-found";
import { buildRailyardDeeplink } from "@/features/registry/detail/lib/build-railyard-deeplink";
import { loadRegistryDetail } from "@/features/registry/detail/lib/load-registry-detail";
import { normalizeRegistryDetail } from "@/features/registry/detail/lib/normalize-registry-detail";
import type { RegistryDetailModel } from "@/features/registry/detail/registry-detail-types";
import { DescriptionTab } from "@/features/registry/detail/components/description-tab";
import { GalleryLightbox } from "@/features/registry/detail/components/gallery-lightbox";
import { GalleryTab } from "@/features/registry/detail/components/gallery-tab";
import { OpenInRailyardDialog } from "@/features/registry/detail/components/open-in-railyard-dialog";
import { RegistryDetailHeader } from "@/features/registry/detail/components/registry-detail-header";
import { RegistryDetailSidebar } from "@/features/registry/detail/components/registry-detail-sidebar";
import {
  RegistryDetailTabs,
  type RegistryDetailTabId,
} from "@/features/registry/detail/components/registry-detail-tabs";
import { VersionsTab } from "@/features/registry/detail/components/versions-tab";

type RegistryDetailPageProps = {
  routeSegment: string;
  id: string;
};

export function RegistryDetailPage({ routeSegment, id }: RegistryDetailPageProps) {
  const suite = getSuiteById("registry");
  const [detail, setDetail] = useState<RegistryDetailModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RegistryDetailTabId>("description");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setDetail(null);

    void loadRegistryDetail(routeSegment, id)
      .then((loaded) => {
        if (isCancelled) {
          return;
        }

        if (!loaded) {
          setDetail(null);
          return;
        }

        setDetail(normalizeRegistryDetail(loaded));
      })
      .catch(() => {
        if (!isCancelled) {
          setDetail(null);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [id, routeSegment]);

  const accentColor = useMemo(() => {
    if (!detail) {
      return "#6b7280";
    }
    return `light-dark(${detail.typeConfig.accentLight}, ${detail.typeConfig.accentDark})`;
  }, [detail]);

  if (!isLoading && !detail) {
    return <NotFoundPage />;
  }

  if (!detail) {
    return (
      <div className="px-5 py-8 text-sm text-muted-foreground sm:px-7 md:px-9 lg:px-12">
        Loading registry listing...
      </div>
    );
  }

  const openImageAt = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openRailyard = () => {
    const deeplink = buildRailyardDeeplink(detail.routeSegment, detail.id);
    window.location.href = deeplink;
  };

  return (
    <SuiteAccentScope accent={suite.accent} className="-mx-5 sm:-mx-7 md:-mx-9 lg:-mx-12">
      <div
        className="mx-auto max-w-[1200px] space-y-6 px-5 py-6 sm:px-7 md:px-9 lg:px-12"
        style={{ ["--registry-type-accent" as string]: accentColor }}
      >
        <RegistryDetailHeader
          detail={detail}
          accentColor={accentColor}
          onOpenInRailyard={() => setDialogOpen(true)}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <main className="min-w-0 space-y-4">
            <RegistryDetailTabs value={activeTab} onValueChange={setActiveTab} />

            <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
              {activeTab === "description" ? (
                <DescriptionTab description={detail.description} />
              ) : null}
              {activeTab === "gallery" ? (
                <GalleryTab
                  itemName={detail.name}
                  images={detail.galleryImages}
                  onOpen={openImageAt}
                />
              ) : null}
              {activeTab === "versions" ? <VersionsTab versions={detail.versions} /> : null}
            </section>
          </main>

          <RegistryDetailSidebar
            detail={detail}
            accentColor={accentColor}
            onOpenInRailyard={() => setDialogOpen(true)}
            onOpenImage={openImageAt}
          />
        </div>
      </div>

      <OpenInRailyardDialog
        open={dialogOpen}
        itemName={detail.name}
        onOpenChange={setDialogOpen}
        onConfirm={openRailyard}
      />

      <GalleryLightbox
        open={lightboxOpen}
        images={detail.galleryImages}
        currentIndex={lightboxIndex}
        onOpenChange={setLightboxOpen}
        onPrevious={() =>
          setLightboxIndex((current) => {
            if (detail.galleryImages.length === 0) {
              return 0;
            }
            return (current - 1 + detail.galleryImages.length) % detail.galleryImages.length;
          })
        }
        onNext={() =>
          setLightboxIndex((current) => {
            if (detail.galleryImages.length === 0) {
              return 0;
            }
            return (current + 1) % detail.galleryImages.length;
          })
        }
      />
    </SuiteAccentScope>
  );
}
