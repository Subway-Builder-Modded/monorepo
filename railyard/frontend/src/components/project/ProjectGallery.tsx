import { EmptyState } from '@subway-builder-modded/asset-listings-ui';
import { type AssetType } from '@subway-builder-modded/config';
import {
  Button,
  Dialog,
  DialogContent,
} from '@subway-builder-modded/shared-ui';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';

import { GalleryImage } from '@/components/shared/GalleryImage';

interface ProjectGalleryProps {
  type: AssetType;
  id: string;
  gallery: string[];
}

export function ProjectGallery({ type, id, gallery }: ProjectGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!gallery?.length) {
    return <EmptyState icon={FileText} title="No gallery images" />;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {gallery.map((imagePath, i) => (
          <button
            key={`${id}-${imagePath}-${i}`}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="block aspect-video rounded-lg overflow-hidden cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GalleryImage
              type={type}
              id={id}
              imagePath={imagePath}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog
        open={selectedIndex !== null}
        onOpenChange={() => setSelectedIndex(null)}
      >
        <DialogContent className="w-[95vw] sm:max-w-none max-h-[95vh] p-2 bg-background/95 backdrop-blur-sm border-border">
          {selectedIndex !== null && gallery[selectedIndex] && (
            <div className="relative flex items-center justify-center">
              <GalleryImage
                type={type}
                id={id}
                imagePath={gallery[selectedIndex]}
                className="max-h-[90vh] rounded-md object-contain"
                fallbackIconClassName="h-10 w-10"
              />
              {gallery.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                    onClick={() =>
                      setSelectedIndex(
                        (selectedIndex - 1 + gallery.length) % gallery.length,
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
                      setSelectedIndex((selectedIndex + 1) % gallery.length)
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {selectedIndex + 1} / {gallery.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
