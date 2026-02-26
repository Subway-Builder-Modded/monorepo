import { useEffect, useState } from "react";
import { main } from "../../wailsjs/go/models";
import { GetGalleryImage } from "../../wailsjs/go/main/Registry";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Package } from "lucide-react";

interface ModCardProps {
  mod: main.ModManifest;
}

export function ModCard({ mod }: ModCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (mod.gallery && mod.gallery.length > 0) {
      setImageLoading(true);
      setImageError(false);
      GetGalleryImage("mods", mod.id, mod.gallery[0])
        .then((data) => {
          setImageUrl(data);
          setImageLoading(false);
        })
        .catch(() => {
          setImageError(true);
          setImageLoading(false);
        });
    } else {
      setImageLoading(false);
    }
  }, [mod.id, mod.gallery]);

  const hasGallery = mod.gallery && mod.gallery.length > 0;

  return (
    <Card className="flex flex-col overflow-hidden py-0">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imageLoading && hasGallery ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={mod.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardHeader className="pb-0">
        <CardTitle className="text-base">{mod.name}</CardTitle>
        <CardDescription>{mod.author}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {mod.description}
        </p>
        {mod.tags && mod.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {mod.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {mod.source && (
        <CardFooter className="pt-0 pb-4">
          <a
            href={mod.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" />
            Source
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
