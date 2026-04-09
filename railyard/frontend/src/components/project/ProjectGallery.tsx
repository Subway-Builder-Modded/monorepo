import {
  Button,
  Dialog,
  DialogContent,
  Skeleton,
} from '@subway-builder-modded/shared-ui';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/shared/EmptyState';
import { type AssetType, assetTypeToListingPath } from '@/lib/asset-types';

import { GetGalleryImageResponse } from '../../../wailsjs/go/registry/Registry';

interface ProjectGalleryProps {
  type: AssetType;
  id: string;
  gallery: string[];
}

export function ProjectGallery({ type, id, gallery }: ProjectGalleryProps) {
  const [images, setImages] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gallery || gallery.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      gallery.map((path) =>
        GetGalleryImageResponse(assetTypeToListingPath(type), id, path)
          .then((r) => (r.status === 'success' ? r.imageUrl : null))
          .catch(() => null),
      ),
    ).then((urls) => {
      setImages(urls);
      setLoading(false);
    });
  }, [type, id, gallery]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: Math.min(gallery?.length || 3, 6) }).map(
          (_, i) => (
            <Skeleton key={i} className="aspect-video rounded-lg" />
          ),
        )}
      </div>
    );
  }

  const validImages = images.filter((url): url is string => url !== null);

  if (validImages.length === 0) {
    return <EmptyState icon={FileText} title="No gallery images" />;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {validImages.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="block aspect-video rounded-lg overflow-hidden cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={() => setSelectedIndex(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-none max-h-[95vh] p-2 bg-background/95 backdrop-blur-sm border-border">
          {selectedIndex !== null && validImages[selectedIndex] && (
            <div className="relative flex items-center justify-center">
              <img
                src={validImages[selectedIndex]}
                alt=""
                className="max-h-[90vh] rounded-md object-contain"
              />
              {validImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() =>
                      setSelectedIndex(
                        (selectedIndex - 1 + validImages.length) %
                          validImages.length,
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() =>
                      setSelectedIndex((selectedIndex + 1) % validImages.length)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {selectedIndex + 1} / {validImages.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
