'use client';

import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';

import { EmptyState } from '@/features/railyard/components/empty-state';
import { GalleryImage } from '@/features/railyard/components/gallery-image';
import { Button } from '@/components/ui/button';

interface ProjectGalleryProps {
  type: 'mods' | 'maps';
  id: string;
  gallery: string[];
}

export function ProjectGallery({ type, id, gallery }: ProjectGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No gallery images"
        description="This project has no gallery images."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {gallery.map((imagePath, i) => (
          <button
            key={imagePath}
            type="button"
            onClick={() => setSelectedIndex(i)}
            className="block aspect-video rounded-lg overflow-hidden cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GalleryImage
              type={type}
              id={id}
              imagePath={imagePath}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {selectedIndex !== null && gallery[selectedIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            className="relative flex items-center justify-center p-2 w-[95vw] max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <GalleryImage
              type={type}
              id={id}
              imagePath={gallery[selectedIndex]}
              className="max-h-[90vh] rounded-md object-contain"
            />
            {gallery.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="sq-sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onPress={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + gallery.length) % gallery.length,
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sq-sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm"
                  onPress={() =>
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
        </div>
      )}
    </>
  );
}
