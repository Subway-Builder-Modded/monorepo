import { useEffect, useState, useMemo, useCallback } from "react";
import { main } from "../wailsjs/go/models";
import {
  GetMods,
  GetMaps,
  Refresh,
} from "../wailsjs/go/main/Registry";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ModCard } from "@/components/ModCard";
import { MapCard } from "@/components/MapCard";
import {
  RefreshCw,
  Search,
  Package,
  MapPin,
  AlertCircle,
} from "lucide-react";

function App() {
  const [mods, setMods] = useState<main.ModManifest[]>([]);
  const [maps, setMaps] = useState<main.MapManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [modSearch, setModSearch] = useState("");
  const [mapSearch, setMapSearch] = useState("");

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [modsData, mapsData] = await Promise.all([GetMods(), GetMaps()]);
      setMods(modsData || []);
      setMaps(mapsData || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registry data"
      );
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Refresh();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to refresh registry"
      );
    } finally {
      setRefreshing(false);
    }
  };

  const filteredMods = useMemo(() => {
    if (!modSearch.trim()) return mods;
    const query = modSearch.toLowerCase();
    return mods.filter(
      (mod) =>
        mod.name?.toLowerCase().includes(query) ||
        mod.author?.toLowerCase().includes(query) ||
        mod.description?.toLowerCase().includes(query) ||
        mod.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [mods, modSearch]);

  const filteredMaps = useMemo(() => {
    if (!mapSearch.trim()) return maps;
    const query = mapSearch.toLowerCase();
    return maps.filter(
      (map) =>
        map.name?.toLowerCase().includes(query) ||
        map.author?.toLowerCase().includes(query) ||
        map.description?.toLowerCase().includes(query) ||
        map.city_code?.toLowerCase().includes(query) ||
        map.country?.toLowerCase().includes(query) ||
        map.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [maps, mapSearch]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold tracking-tight">The Railyard</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Tabs defaultValue="mods">
          <TabsList>
            <TabsTrigger value="mods" className="gap-1.5">
              <Package className="h-4 w-4" />
              Mods
              {!loading && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({mods.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="maps" className="gap-1.5">
              <MapPin className="h-4 w-4" />
              Maps
              {!loading && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({maps.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mods">
            <div className="mb-6 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search mods by name, author, description, or tag..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading ? (
              <CardSkeletonGrid />
            ) : filteredMods.length === 0 ? (
              <EmptyState
                icon={<Package className="h-12 w-12" />}
                message={
                  modSearch
                    ? "No mods match your search"
                    : "No mods found in the registry"
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMods.map((mod) => (
                  <ModCard key={mod.id} mod={mod} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="maps">
            <div className="mb-6 mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search maps by name, author, city, country, or tag..."
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {loading ? (
              <CardSkeletonGrid />
            ) : filteredMaps.length === 0 ? (
              <EmptyState
                icon={<MapPin className="h-12 w-12" />}
                message={
                  mapSearch
                    ? "No maps match your search"
                    : "No maps found in the registry"
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMaps.map((map) => (
                  <MapCard key={map.id} map={map} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function CardSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border bg-card"
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-1">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: React.ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      {icon}
      <p className="mt-4 text-sm">{message}</p>
    </div>
  );
}

export default App;
