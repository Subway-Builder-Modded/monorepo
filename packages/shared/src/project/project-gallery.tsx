import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { EmptyState } from '../railyard-ui/shared/empty-state';
import { cx } from '../railyard-ui/shared/cx';

export interface ProjectGalleryProps {
  gallery: string[];
  /**
   * Renders a gallery image. Called with the raw image path and a className.
   * Each platform provides its own image loader (Next.js Image, Wails IPC, etc.).
   */
  renderImage: (imagePath: string, className: string) => ReactNode;
  emptyDescription?: string;
}

export function ProjectGallery({
  gallery,
  renderImage,
  emptyDescription = 'This project has no gallery images.',
}: ProjectGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No gallery images"
        description={emptyDescription}
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
            {renderImage(imagePath, 'w-full h-full object-cover')}
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
            {renderImage(gallery[selectedIndex], 'max-h-[90vh] rounded-md object-contain')}
            {gallery.length > 1 && (
              <>
                <button
                  type="button"
                  className={cx(
                    'absolute left-2 top-1/2 -translate-y-1/2',
                    'inline-flex items-center justify-center rounded-md border border-input',
                    'h-8 w-8 bg-background/80 backdrop-blur-sm text-foreground',
                    'hover:bg-accent hover:text-accent-foreground transition-colors',
                  )}
                  aria-label="Previous image"
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + gallery.length) % gallery.length,
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cx(
                    'absolute right-2 top-1/2 -translate-y-1/2',
                    'inline-flex items-center justify-center rounded-md border border-input',
                    'h-8 w-8 bg-background/80 backdrop-blur-sm text-foreground',
                    'hover:bg-accent hover:text-accent-foreground transition-colors',
                  )}
                  aria-label="Next image"
                  onClick={() =>
                    setSelectedIndex((selectedIndex + 1) % gallery.length)
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
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
