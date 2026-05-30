type GalleryTabProps = {
  itemName: string;
  images: string[];
  onOpen: (index: number) => void;
};

export function GalleryTab({ itemName, images, onOpen }: GalleryTabProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {images.map((src, index) => (
        <button
          key={src}
          type="button"
          onClick={() => onOpen(index)}
          className="group overflow-hidden rounded-xl border border-border/70 bg-card text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--registry-type-accent)]"
          aria-label={`Open gallery image ${index + 1} for ${itemName}`}
        >
          <img
            src={src}
            alt={`${itemName} gallery image ${index + 1}`}
            className="aspect-video w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.06]"
          />
        </button>
      ))}
    </div>
  );
}
