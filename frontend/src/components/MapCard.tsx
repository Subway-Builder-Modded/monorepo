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
import { ExternalLink, MapPin } from "lucide-react";

interface MapCardProps {
  map: main.MapManifest;
}

export function MapCard({ map }: MapCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (map.gallery && map.gallery.length > 0) {
      setImageLoading(true);
      setImageError(false);
      GetGalleryImage("maps", map.id, map.gallery[0])
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
  }, [map.id, map.gallery]);

  const hasGallery = map.gallery && map.gallery.length > 0;

  return (
    <Card className="flex flex-col overflow-hidden py-0">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {imageLoading && hasGallery ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={map.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base">{map.name}</CardTitle>
            <CardDescription>{map.author}</CardDescription>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-sm font-semibold text-foreground">
              {map.city_code}
            </span>
            <p className="text-xs text-muted-foreground">{map.country}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {map.population > 0 && (
          <p className="mb-2 text-xs text-muted-foreground">
            Pop. {map.population.toLocaleString()}
          </p>
        )}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {map.description}
        </p>
        {map.tags && map.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {map.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      {map.source && (
        <CardFooter className="pt-0 pb-4">
          <a
            href={map.source}
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
