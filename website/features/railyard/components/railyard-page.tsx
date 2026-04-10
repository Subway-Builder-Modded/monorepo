'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  ArrowRight,
  Map as MapIcon,
  MapPlus,
  Settings,
  BrushCleaning,
  Package,
  CheckCircle,
  TrainTrack,
  Search,
  Download,
  BookText,
  Users,
  CodeXml,
  Tag,
  Globe,
} from 'lucide-react';

import { ItemCard } from '@/features/railyard/components/item-card';
import { MarkdownText } from '@/components/ui/markdown-text';
import {
  Marquee,
  MarqueeContent,
  MarqueeEdge,
  MarqueeItem,
} from '@/components/ui/marquee';
import { Card } from '@/components/ui/card';
import { LineBullet } from '@/components/ui/line-bullet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  LANDING_HERO_COPY,
  interpolateHeroText,
} from '@/config/content/landing-hero';
import { getUpdateProjectById } from '@/config/content/updates';
import { useRegistry } from '@/hooks/use-registry';
import { DEFAULT_SORT_STATE } from '@/lib/railyard/constants';
import type { GithubRelease } from '@/lib/railyard/github-releases';
import { getGithubReleases } from '@/lib/railyard/github-releases';
import { fetchRegistryJsonWithFallback } from '@/lib/railyard/registry-source';
import { buildTaggedItems, compareItems } from '@/lib/railyard/tagged-items';
import { cn } from '@subway-builder-modded/shared-ui';

// ─── Data ──────────────────────────────────────────────────────────────────

interface DownloadEntry {
  os: string;
  arch: string;
  label: string;
  type: string;
  size: string;
  link: string;
  assetName: string;
}

type PlatformInfo = {
  os: DownloadEntry['os'];
  arch: DownloadEntry['arch'];
};

type FeatureItemBase = {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
};

type FeatureItem = FeatureItemBase &
  ({ letter: string; icon?: never } | { icon: LucideIcon; letter?: never });

const DOWNLOAD_TEMPLATE: DownloadEntry[] = [
  {
    os: 'Windows',
    arch: 'x64',
    label: 'Windows (x64) - Installer (beta)',
    type: '.exe',
    size: '—',
    link: '#',
    assetName: 'windows-amd64-installer.exe',
  },
  {
    os: 'Windows',
    arch: 'x64',
    label: 'Windows (x64) - Portable (beta)',
    type: '.zip',
    size: '—',
    link: '#',
    assetName: 'windows-amd64-portable.zip',
  },
  {
    os: 'Windows',
    arch: 'arm64',
    label: 'Windows (ARM64) - Installer (beta)',
    type: '.exe',
    size: '—',
    link: '#',
    assetName: 'windows-arm64-installer.exe',
  },
  {
    os: 'Windows',
    arch: 'arm64',
    label: 'Windows (ARM64) - Portable (beta)',
    type: '.zip',
    size: '—',
    link: '#',
    assetName: 'windows-arm64-portable.zip',
  },
  {
    os: 'macOS',
    arch: 'universal',
    label: 'macOS - Universal (beta)',
    type: '.dmg',
    size: '—',
    link: '#',
    assetName: 'macos-universal.dmg',
  },
  {
    os: 'macOS',
    arch: 'universal',
    label: 'macOS (ZIP) - Universal (beta)',
    type: '.zip',
    size: '—',
    link: '#',
    assetName: 'macos-universal.zip',
  },
  {
    os: 'Linux',
    arch: 'x64',
    label: 'Linux (x64) - (beta)',
    type: '.flatpak',
    size: '—',
    link: '#',
    assetName: 'current-linux-amd64.flatpak',
  },
];

const DISCOVER_MARQUEE_ITEM_CLASS =
  'w-[clamp(11.4rem,28vw,13.75rem)] origin-top';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '—';
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function buildDownloads(
  releaseAssets: { name: string; browser_download_url: string; size: number }[],
): DownloadEntry[] {
  return DOWNLOAD_TEMPLATE.map((entry) => {
    const asset = releaseAssets.find((a) => a.name.endsWith(entry.assetName));
    if (!asset) return entry;
    return {
      ...entry,
      link: asset.browser_download_url,
      size: formatBytes(asset.size),
    };
  });
}

function pickLatestStableRelease(
  releases: GithubRelease[],
): GithubRelease | null {
  return releases.find((release) => !release.prerelease) ?? null;
}

function getDownloadCatalog(downloads: DownloadEntry[]) {
  const byOS = new Map<string, DownloadEntry[]>();
  downloads.forEach((d) => {
    if (!byOS.has(d.os)) byOS.set(d.os, []);
    byOS.get(d.os)!.push(d);
  });
  return Array.from(byOS.entries()).map(([os, items]) => ({
    os,
    downloads: items,
  }));
}

function detectPlatform(): PlatformInfo {
  if (typeof navigator === 'undefined') return { os: 'Windows', arch: 'x64' };

  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  // Check user agent for ARM indicators: WOW64, ARM64, aarch64, ARM
  const isArm =
    /arm64|aarch64|wow64.*arm/.test(ua) || /arm|aarch64/.test(platform);

  if (ua.includes('mac')) return { os: 'macOS', arch: 'universal' };
  if (ua.includes('linux')) return { os: 'Linux', arch: 'x64' };
  return { os: 'Windows', arch: isArm ? 'arm64' : 'x64' };
}

async function detectPlatformWithHints() {
  const fallback = detectPlatform();
  if (typeof navigator === 'undefined') return fallback;

  const navWithUAData = navigator as Navigator & {
    userAgentData?: {
      platform?: string;
      architecture?: string;
      getHighEntropyValues?: (
        hints: string[],
      ) => Promise<{ architecture?: string; platform?: string }>;
    };
  };

  const uaData = navWithUAData.userAgentData;
  if (!uaData) return fallback;

  try {
    const highEntropy = uaData.getHighEntropyValues
      ? await uaData.getHighEntropyValues(['architecture', 'platform'])
      : undefined;

    const platform = (
      highEntropy?.platform ??
      uaData.platform ??
      ''
    ).toLowerCase();
    const architecture = (
      highEntropy?.architecture ??
      uaData.architecture ??
      ''
    ).toLowerCase();
    // Use user agent detection for ARM as fallback since some browsers hide it in userAgentData
    const isArm = /arm|aarch64/.test(architecture) || fallback.arch === 'arm64';

    if (platform.includes('mac'))
      return { os: 'macOS', arch: 'universal' as const };
    if (platform.includes('linux'))
      return { os: 'Linux', arch: 'x64' as const };
    if (platform.includes('win') || fallback.os === 'Windows') {
      return { os: 'Windows', arch: isArm ? 'arm64' : 'x64' };
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function pickNativeDownload(
  downloads: DownloadEntry[],
  platform: PlatformInfo,
): DownloadEntry {
  return (
    downloads.find((d) => d.os === platform.os && d.arch === platform.arch) ??
    downloads.find((d) => d.os === platform.os) ??
    downloads[0]
  );
}

const FEATURES: FeatureItem[] = [
  {
    id: 'maps',
    icon: MapPlus,
    title: 'Custom Cities',
    desc: 'Browse community-made maps of cities from around the world and install them at the press of a button.',
    bullets: [
      'Search and filter maps to find what you want.',
      'One-click installation — no manual file management.',
      'Stay up to date with the latest community creations.',
    ],
  },
  {
    id: 'mods',
    icon: Package,
    title: 'Mod Browser',
    desc: 'Discover and install gameplay mods to enhance your Subway Builder experience.',
    bullets: [
      'Search and browse community-made mods.',
      'Install mods instantly with a single click.',
      'Spend more time playing, less time configuring.',
    ],
  },
  {
    id: 'interface',
    icon: BrushCleaning,
    title: 'Intuitive Interface',
    desc: 'A clean, friendly UI designed to make managing your Subway Builder content effortless.',
    bullets: [
      "A clean, sleek UI that doesn't get in the way.",
      'Completely configurable, with extensive customization.',
      'Designed with accessibility and ease of use in mind.',
    ],
  },
  {
    id: 'manage',
    icon: Settings,
    title: 'Content Management',
    desc: 'Manage your installed content and keep everything organized.',
    bullets: [
      'Easily track and manage your installed maps and mods.',
      'Keep your content organized with one-click uninstallation and updates.',
      "Never lose track of what you have installed or what's new in the community.",
    ],
  },
];

const WORKFLOW_STOPS = [
  {
    id: 'find',
    icon: Search,
    title: 'Find',
    desc: 'Browse curated maps and mods from the community.',
  },
  {
    id: 'install',
    icon: Download,
    title: 'Install',
    desc: 'Choose what you want and install it quickly.',
  },
  {
    id: 'manage',
    icon: Settings,
    title: 'Manage',
    desc: 'Enable or disable content anytime for each playthrough.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────

export default function RailyardPage() {
  const { scrollY } = useScroll();
  const heroScale = useTransform(scrollY, [-240, 0, 900], [1, 1, 1.32]);
  const heroY = useTransform(scrollY, [-240, 0, 900], [0, 0, -140]);
  const {
    mods,
    maps,
    modDownloadTotals,
    mapDownloadTotals,
    loading: registryLoading,
    error: registryError,
  } = useRegistry();

  const [menuOpen, setMenuOpen] = useState(false);
  const [downloads, setDownloads] =
    useState<DownloadEntry[]>(DOWNLOAD_TEMPLATE);
  const [mapCount, setMapCount] = useState<number | null>(null);
  const [modCount, setModCount] = useState<number | null>(null);
  const [activeStop, setActiveStop] = useState(WORKFLOW_STOPS[0].id);
  const [detectedPlatform, setDetectedPlatform] = useState<PlatformInfo>(() =>
    detectPlatform(),
  );
  const [selectedOS, setSelectedOS] = useState('Windows');
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const nativeDownload = useMemo(() => {
    if (!hasMounted) return downloads[0];
    return pickNativeDownload(downloads, detectedPlatform);
  }, [detectedPlatform, downloads, hasMounted]);
  const downloadCatalog = useMemo(
    () => getDownloadCatalog(downloads),
    [downloads],
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    void detectPlatformWithHints().then((platform) => {
      if (!isMounted) return;
      setDetectedPlatform(platform);
      setSelectedOS(platform.os);
    });

    // Fetch latest release assets from cache-first GitHub source
    getGithubReleases('Subway-Builder-Modded/monorepo')
      .then((releases) => {
        const latestStableRelease = pickLatestStableRelease(releases);
        if (!latestStableRelease) return;
        setDownloads(buildDownloads(latestStableRelease.assets));
      })
      .catch(() => {
        /* keep template with # links */
      });

    async function fetchCount(
      path: string,
      key: string,
      setValue: (n: number) => void,
    ) {
      try {
        const data =
          await fetchRegistryJsonWithFallback<Record<string, unknown>>(path);
        if (Array.isArray(data[key])) setValue(data[key].length);
        else if (Array.isArray(data)) setValue(data.length);
      } catch {
        /* ignore */
      }
    }

    fetchCount('maps/index.json', 'maps', setMapCount);
    fetchCount('mods/index.json', 'mods', setModCount);

    const closeMenu = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => {
      isMounted = false;
      document.removeEventListener('mousedown', closeMenu);
    };
  }, []);

  const selectedDownloads = useMemo(
    () => downloads.filter((d) => d.os === selectedOS),
    [downloads, selectedOS],
  );

  const recentProjects = useMemo(() => {
    const allItems = buildTaggedItems(mods, maps);

    return [...allItems]
      .sort((left, right) =>
        compareItems(
          left,
          right,
          DEFAULT_SORT_STATE,
          modDownloadTotals,
          mapDownloadTotals,
        ),
      )
      .slice(0, 7);
  }, [maps, mapDownloadTotals, modDownloadTotals, mods]);

  const mapCountLabel = mapCount == null ? '—' : mapCount.toLocaleString();
  const modCountLabel = modCount == null ? '—' : modCount.toLocaleString();
  const currentVersion =
    getUpdateProjectById('railyard')?.currentVersion ?? '—';
  const heroCopy = LANDING_HERO_COPY.railyard;
  const versionLabelMd = interpolateHeroText(heroCopy.versionLabelMd, {
    currentVersion,
  });
  const downloadLabelMd = interpolateHeroText(heroCopy.downloadLabelMd, {
    nativeLabel: nativeDownload.label,
  });

  return (
    <main
      className={cn(
        'railyard-accent relative min-h-screen text-foreground',
        '[--ry-accent:var(--suite-accent-light)] [--ry-primary:var(--suite-primary-light)] [--ry-secondary:var(--suite-secondary-light)] [--ry-text:var(--suite-text-light)] [--ry-text-inverted:var(--suite-text-inverted-light)]',
        'dark:[--ry-accent:var(--suite-accent-dark)] dark:[--ry-primary:var(--suite-primary-dark)] dark:[--ry-secondary:var(--suite-secondary-dark)] dark:[--ry-text:var(--suite-text-dark)] dark:[--ry-text-inverted:var(--suite-text-inverted-dark)]',
      )}
    >
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <motion.div
          className="absolute inset-0"
          style={{ scale: heroScale, y: heroY }}
        >
          <Image
            src="/images/railyard/main-light.png"
            alt=""
            fill
            priority
            className="object-cover blur-[6px] dark:hidden"
          />
          <Image
            src="/images/railyard/main-dark.png"
            alt=""
            fill
            priority
            className="hidden object-cover blur-[6px] dark:block"
          />
        </motion.div>
        <div className="absolute inset-0 bg-[#28E6AA]/4 dark:bg-[#19D89C]/4" />
      </div>

      {/* ─── Hero + Recently Updated (Initial Viewport) ────────────────── */}
      <section className="relative z-20 h-[calc(100svh-clamp(3.75rem,6vh,4.75rem))] overflow-hidden px-[clamp(0.85rem,3.5vw,2.4rem)] pt-[clamp(2.25rem,4.3vh,3.8rem)] pb-[clamp(0.45rem,1vh,0.85rem)] mb-[clamp(4rem,9vh,8.5rem)]">
        <div className="grid h-full w-full grid-rows-[minmax(0,1fr)_auto] gap-[clamp(0.4rem,1vh,0.75rem)] overflow-visible -translate-y-[clamp(0.6rem,1.8vh,1.5rem)]">
          <div className="relative z-30 flex min-h-0 items-center justify-center overflow-visible">
            <div className="relative z-30 flex w-full max-w-[min(92vw,43rem)] sm:scale-[1.25] flex-col items-center text-center origin-center">
              <span
                className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
                style={{
                  borderColor: 'var(--ry-secondary)',
                  backgroundColor: 'var(--ry-primary)',
                  color: 'var(--ry-accent)',
                }}
              >
                <Tag className="size-3.5" aria-hidden="true" />
                <MarkdownText content={versionLabelMd} />
              </span>
              <h1 className="inline-flex items-center gap-3 text-[clamp(1.72rem,5.7vw,3.55rem)] font-black leading-[0.98] tracking-[-0.03em] max-[420px]:text-[clamp(1.5rem,5.7vw,2.05rem)]">
                <TrainTrack aria-hidden="true" className="size-[0.68em]" />
                <MarkdownText content={heroCopy.titleMd} />
                <span
                  className="self-center border-[#A87400] text-[#A87400] dark:border-[#d29922] dark:text-[#d29922]"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateY(0.12em)',
                    borderWidth: '1.5px',
                    borderStyle: 'solid',
                    borderRadius: '9999px',
                    padding: '0.22em 0.52em',
                    fontSize: '0.42em',
                    fontWeight: 500,
                    lineHeight: '1',
                    letterSpacing: 'normal',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ transform: 'translateY(-0.03em)' }}>
                    <MarkdownText content={heroCopy.betaBadgeMd} />
                  </span>
                </span>
              </h1>

              <div className="mt-2 h-px w-[min(66vw,17rem)] bg-gradient-to-r from-transparent via-[var(--ry-accent)]/80 to-transparent" />

              <div
                ref={dropdownRef}
                className="relative z-[70] mt-4 inline-flex max-[560px]:mt-3"
              >
                <div
                  className="inline-flex overflow-hidden rounded-lg border shadow-md"
                  style={{ borderColor: 'var(--ry-secondary)' }}
                >
                  <a
                    href={nativeDownload.link}
                    className={cn(
                      'inline-flex items-center px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm',
                    )}
                    style={{
                      backgroundColor: 'var(--ry-accent)',
                      color: 'var(--ry-text-inverted)',
                    }}
                  >
                    <MarkdownText content={downloadLabelMd} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="More download options"
                    aria-expanded={menuOpen}
                    className={cn(
                      'flex w-9 items-center justify-center border-l transition-opacity hover:opacity-90',
                    )}
                    style={{
                      borderLeftColor: 'var(--ry-secondary)',
                      backgroundColor: 'var(--ry-accent)',
                      color: 'var(--ry-text-inverted)',
                    }}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        menuOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </div>

                {menuOpen && (
                  <div className="absolute left-1/2 top-full z-[80] mt-1.5 min-w-[290px] -translate-x-1/2 rounded-lg border border-border bg-popover py-1 shadow-lg ring-1 ring-foreground/10 sm:left-0 sm:translate-x-0">
                    {downloads.map((dl) => (
                      <a
                        key={dl.label}
                        href={dl.link}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between gap-4 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        <span>{dl.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {dl.type}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 max-[560px]:mt-2.5 max-[560px]:gap-1.5">
                <Link
                  href="/railyard/browse?type=maps"
                  className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-accent/60 sm:px-3 sm:py-1.5"
                >
                  <MapIcon
                    className="h-3.5 w-3.5 shrink-0 self-center text-foreground/80 transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center leading-none">
                    <span className="text-xs font-bold tabular-nums sm:text-sm">
                      {mapCountLabel}
                    </span>
                    <span className="ml-1 text-[11px] sm:text-xs">
                      <MarkdownText content={heroCopy.mapCountLabelMd} />
                    </span>
                  </span>
                </Link>
                <Link
                  href="/railyard/browse?type=mods"
                  className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-foreground backdrop-blur-sm transition-colors hover:bg-accent/60 sm:px-3 sm:py-1.5"
                >
                  <Package
                    className="h-3.5 w-3.5 shrink-0 self-center text-foreground/80 transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center leading-none">
                    <span className="text-xs font-bold tabular-nums sm:text-sm">
                      {modCountLabel}
                    </span>
                    <span className="ml-1 text-[11px] sm:text-xs">
                      <MarkdownText content={heroCopy.modCountLabelMd} />
                    </span>
                  </span>
                </Link>
                <a
                  href="https://discord.gg/syG9YHMyeG"
                  target="_blank"
                  rel="noreferrer"
                  aria-label={heroCopy.discordAriaLabel}
                  className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/60 backdrop-blur-sm hover:bg-accent/60 transition-colors group sm:size-10"
                >
                  <Image
                    src="/assets/discord.svg"
                    alt=""
                    width={20}
                    height={20}
                    className="size-4 dark:invert sm:size-5"
                    aria-hidden="true"
                  />
                </a>
                <HeroIconLink
                  href="/railyard/docs"
                  ariaLabel={heroCopy.docsAriaLabel}
                  icon={BookText}
                />
                <HeroIconLink
                  href="/registry/world-map"
                  ariaLabel={heroCopy.worldMapAriaLabel}
                  icon={Globe}
                />
              </div>
            </div>
          </div>

          <div className="relative z-10 -translate-y-[clamp(2.2rem,2.75vh,2.6rem)] rounded-2xl border border-border/80 bg-background/88 px-2.5 py-2 shadow-sm backdrop-blur-md sm:px-3 sm:py-2.5 max-[420px]:px-2 max-[420px]:py-1.5">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <h2 className="text-md font-semibold tracking-tight text-foreground">
                Discover
              </h2>
              <Link
                href="/railyard/browse"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                View
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="pt-[clamp(0.35rem,1.1vh,0.95rem)]">
              {registryLoading ? (
                <Marquee
                  className="rounded-xl"
                  speed={24}
                  autoFill
                  pauseOnHover
                  pauseOnKeyboard
                  gap="0.625rem"
                >
                  <MarqueeContent>
                    {Array.from({ length: 8 }).map((_, index) => (
                      <MarqueeItem
                        key={`discover-skeleton-${index}`}
                        className={DISCOVER_MARQUEE_ITEM_CLASS}
                      >
                        <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
                          <div className="aspect-[16/10] w-full animate-pulse bg-muted/50" />
                          <div className="space-y-2.5 p-3">
                            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted/50" />
                            <div className="h-3 w-2/5 animate-pulse rounded bg-muted/45" />
                            <div className="space-y-1.5 pt-0.5">
                              <div className="h-2.5 w-full animate-pulse rounded bg-muted/45" />
                              <div className="h-2.5 w-4/5 animate-pulse rounded bg-muted/45" />
                            </div>
                          </div>
                        </div>
                      </MarqueeItem>
                    ))}
                  </MarqueeContent>
                  <MarqueeEdge side="left" size="sm" />
                  <MarqueeEdge side="right" size="sm" />
                </Marquee>
              ) : recentProjects.length === 0 ? (
                <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-4 text-xs text-muted-foreground sm:text-sm">
                  {registryError
                    ? 'Unable to load the recent registry feed right now.'
                    : 'No recent projects are available yet.'}
                </div>
              ) : (
                <Marquee
                  className="rounded-xl"
                  speed={24}
                  autoFill
                  pauseOnHover
                  pauseOnKeyboard
                  gap="0.625rem"
                >
                  <MarqueeContent>
                    {recentProjects.map(({ type, item }) => (
                      <MarqueeItem
                        key={`${type}-${item.id}`}
                        className={DISCOVER_MARQUEE_ITEM_CLASS}
                      >
                        <ItemCard
                          type={type}
                          item={item}
                          viewMode="compact"
                          totalDownloads={
                            type === 'mod'
                              ? (modDownloadTotals[item.id] ?? 0)
                              : (mapDownloadTotals[item.id] ?? 0)
                          }
                        />
                      </MarqueeItem>
                    ))}
                  </MarqueeContent>
                  <MarqueeEdge side="left" size="sm" />
                  <MarqueeEdge side="right" size="sm" />
                </Marquee>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="Features" />
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                return (
                  <Card
                    key={feature.id}
                    className={cn(
                      'relative overflow-hidden cursor-pointer transition-all duration-200 outline-none p-6',
                      'border border-border hover:border-[var(--ry-accent)] hover:shadow-md hover:ring-1 hover:ring-[var(--ry-primary)]',
                    )}
                    role="article"
                  >
                    <div className="flex items-start gap-4">
                      <LineBullet
                        icon={
                          feature.icon ? (
                            <feature.icon
                              className="size-4"
                              aria-hidden="true"
                            />
                          ) : undefined
                        }
                        text={feature.icon ? undefined : feature.letter}
                        colorRole="accentColor"
                        textRole="textColorInverted"
                        shape="circle"
                        size="md"
                        className="shrink-0 mt-0.5"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                          {feature.desc}
                        </p>
                        <ul className="mt-3 space-y-1.5">
                          {feature.bullets.map((bullet) => (
                            <li
                              key={bullet}
                              className="flex items-start gap-2 text-sm text-muted-foreground"
                            >
                              <CheckCircle
                                className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--ry-accent)]"
                                aria-hidden="true"
                              />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Workflow ──────────────────────────────────────────────────── */}
      <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="From Download to Play in Three Stops" />
            <div className="mt-10 grid sm:grid-cols-3 gap-4">
              {WORKFLOW_STOPS.map((stop) => {
                const active = activeStop === stop.id;
                return (
                  <button
                    key={stop.id}
                    type="button"
                    onClick={() => setActiveStop(stop.id)}
                    onMouseEnter={() => setActiveStop(stop.id)}
                    onFocus={() => setActiveStop(stop.id)}
                    className={cn(
                      'flex h-full flex-col text-left p-5 rounded-xl border transition-all duration-200 outline-none',
                      active
                        ? 'border-[var(--ry-accent)] bg-[var(--ry-secondary)] shadow-md ring-1 ring-[var(--ry-primary)]'
                        : 'border-border hover:border-border/80 hover:bg-accent/40',
                    )}
                  >
                    <div className="mb-2 flex min-h-7 items-center gap-3">
                      <LineBullet
                        icon={
                          <stop.icon className="size-3.5" aria-hidden="true" />
                        }
                        colorRole="accentColor"
                        textRole="textColorInverted"
                        shape="circle"
                        size="sm"
                        className={cn('shrink-0', !active && 'opacity-85')}
                      />
                      <h3 className="font-semibold text-foreground">
                        {stop.title}
                      </h3>
                    </div>
                    <p className="pt-0.5 text-sm text-muted-foreground leading-relaxed">
                      {stop.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── World Map ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="World Map" />
            <div className="mt-8">
              <Link
                href="/registry/world-map"
                className="group block rounded-xl border border-border bg-card/70 p-5 transition-all duration-200 hover:border-[var(--ry-accent)] hover:shadow-md hover:ring-1 hover:ring-[var(--ry-primary)]"
              >
                <div className="flex items-center gap-3">
                  <LineBullet
                    icon={<Globe className="size-3.5" aria-hidden="true" />}
                    colorRole="accentColor"
                    textRole="textColorInverted"
                    shape="circle"
                    size="sm"
                  />
                  <h3 className="text-base font-semibold text-foreground">
                    Explore the World of Railyard
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Browse published maps around the world on an interactive world
                  map and jump straight to each project.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ry-accent)]">
                  View
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Documentation ───────────────────────────────────────────── */}
      <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="Documentation" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                href="/railyard/docs/players"
                className="group rounded-xl border border-border bg-card/70 p-5 transition-all duration-200 hover:border-[var(--ry-accent)] hover:shadow-md hover:ring-1 hover:ring-[var(--ry-primary)]"
              >
                <div className="flex items-center gap-3">
                  <LineBullet
                    icon={<Users className="size-3.5" aria-hidden="true" />}
                    colorRole="accentColor"
                    textRole="textColorInverted"
                    shape="circle"
                    size="sm"
                  />
                  <h3 className="text-base font-semibold text-foreground">
                    Players
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  The ultimate guide for players getting started with Railyard,
                  including installation, setup, and configuration.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ry-accent)]">
                  View
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>

              <Link
                href="/railyard/docs/developers"
                className="group rounded-xl border border-border bg-card/70 p-5 transition-all duration-200 hover:border-[var(--ry-accent)] hover:shadow-md hover:ring-1 hover:ring-[var(--ry-primary)]"
              >
                <div className="flex items-center gap-3">
                  <LineBullet
                    icon={<CodeXml className="size-3.5" aria-hidden="true" />}
                    colorRole="accentColor"
                    textRole="textColorInverted"
                    shape="circle"
                    size="sm"
                  />
                  <h3 className="text-base font-semibold text-foreground">
                    Developers
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Learn exactly how to make your project compatible with
                  Railyard and how to submit it to the registry.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ry-accent)]">
                  View
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── Community ─────────────────────────────────────────────────── */}
      <section className="relative z-10 px-[clamp(1.5rem,5vw,4rem)]">
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="Join the Community" />
            <div className="mt-8">
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Talk with other players, get support, and stay up to date on new
                Railyard sneak peeks and updates from the dev team.
              </p>
              <a
                href="https://discord.gg/syG9YHMyeG"
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-md border transition-opacity hover:opacity-90',
                )}
                style={{
                  borderColor: 'var(--ry-secondary)',
                  backgroundColor: 'var(--ry-accent)',
                  color: 'var(--ry-text-inverted)',
                }}
              >
                <Image
                  src="/assets/discord.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="size-[18px] invert dark:invert-0"
                  aria-hidden="true"
                />
                <span>Join the Discord</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ─── All Downloads ─────────────────────────────────────────────── */}
      <section
        className="relative z-10 px-[clamp(1.5rem,5vw,4rem)] pb-24"
        id="all-downloads"
      >
        <div className="w-full rounded-2xl border border-border/80 bg-background/88 px-[clamp(1.25rem,4vw,2.5rem)] py-12 sm:py-20 shadow-sm backdrop-blur-md">
          <div className="w-full">
            <SectionHeader title="All Downloads" />

            <div className="mt-10 rounded-xl border border-border overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* OS tabs (left) */}
                <div className="sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/30">
                  {downloadCatalog.map((group) => (
                    <button
                      key={group.os}
                      type="button"
                      onClick={() => setSelectedOS(group.os)}
                      className={cn(
                        'w-full text-left px-4 py-3 text-sm font-medium transition-colors',
                        selectedOS === group.os
                          ? 'bg-background text-[var(--ry-accent)] border-r-2 border-[var(--ry-accent)] sm:border-r-2 -mr-px'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                      )}
                    >
                      {group.os}
                    </button>
                  ))}
                </div>

                {/* Download buttons (right) */}
                <div className="flex-1 p-4 space-y-2 bg-background">
                  {selectedDownloads.map((dl) => {
                    const isNative = dl.label === nativeDownload.label;
                    return (
                      <a
                        key={dl.label}
                        href={dl.link}
                        className={cn(
                          'flex items-center justify-between gap-4 px-4 py-3 rounded-lg border transition-all group',
                          isNative
                            ? 'border-[var(--ry-accent)] bg-[var(--ry-primary)] hover:bg-[var(--ry-secondary)]'
                            : 'border-border hover:border-border/80 hover:bg-accent/40',
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-medium text-sm text-foreground">
                            {dl.label}
                          </span>
                          {isNative && (
                            <Badge
                              variant="secondary"
                              className="text-xs h-auto px-1.5 py-0"
                            >
                              Detected
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {dl.type} · {dl.size}
                          </span>
                        </div>
                        <ArrowRight
                          className={cn(
                            'h-4 w-4 transition-all shrink-0 group-hover:translate-x-0.5',
                            isNative
                              ? 'text-[var(--ry-accent)]'
                              : 'text-muted-foreground group-hover:text-foreground',
                          )}
                          aria-hidden="true"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function HeroIconLink({
  href,
  ariaLabel,
  icon: Icon,
}: {
  href: string;
  ariaLabel: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="group flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/60 backdrop-blur-sm transition-colors hover:bg-accent/60 sm:size-10"
    >
      <Icon
        className="size-4 text-black dark:text-white sm:size-5"
        aria-hidden="true"
      />
    </Link>
  );
}

function SectionHeader({
  title,
  accent = false,
}: {
  title: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground">
        {title}
      </h2>
      <div
        className={cn(
          'flex-1 h-px',
          accent ? 'bg-[var(--ry-accent)]' : 'bg-border',
        )}
      />
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      className="relative z-10 px-[clamp(1.5rem,5vw,4rem)] py-10"
      aria-hidden="true"
    >
      <div className="w-full">
        <Separator className="bg-border/90" />
      </div>
    </div>
  );
}
