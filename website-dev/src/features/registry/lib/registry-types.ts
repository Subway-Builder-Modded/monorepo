export type RegistryItemBase = {
  id: string;
  kind: "map" | "mod";
  href: string;
  title: string;
  author: string;
  description: string;
  thumbnailSrc: string | null;
  totalDownloads: number;
  cityCode: string | null;
  countryCode: string | null;
  countryName: string | null;
  countryEmoji: string | null;
  population: number | null;
};
