import { GalleryImage } from '../../components/shared/GalleryImage';
import type { AssetType } from '../../lib/asset-types';
import { ProjectGallery as SharedProjectGallery } from '@sbm/shared/project/project-gallery';

interface ProjectGalleryProps {
  type: AssetType;
  id: string;
  gallery: string[];
}

export function ProjectGallery({ type, id, gallery }: ProjectGalleryProps) {
  return (
    <SharedProjectGallery
      gallery={gallery}
      renderImage={(imagePath, className) => (
        <GalleryImage
          type={type}
          id={id}
          imagePath={imagePath}
          className={className}
        />
      )}
    />
  );
}

