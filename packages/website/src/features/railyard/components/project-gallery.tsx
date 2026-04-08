'use client';

import { GalleryImage } from '../../../features/railyard/components/gallery-image';
import { ProjectGallery as SharedProjectGallery } from '@sbm/shared/project/project-gallery';

interface ProjectGalleryProps {
  type: 'mods' | 'maps';
  id: string;
  gallery: string[];
}

export function ProjectGallery({ type, id, gallery }: ProjectGalleryProps) {
  const assetType = type === 'mods' ? 'mod' : 'map';

  return (
    <SharedProjectGallery
      gallery={gallery}
      renderImage={(imagePath, className) => (
        <GalleryImage
          type={assetType}
          id={id}
          imagePath={imagePath}
          className={className}
        />
      )}
    />
  );
}

