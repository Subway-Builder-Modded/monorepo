import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  SectionHeader,
  SectionShell,
} from "@subway-builder-modded/shared-ui";
import { ArrowRight } from "lucide-react";
import {
  detectRailyardPlatformAccurate,
  fetchRailyardReleaseAssetInfo,
  formatRailyardAssetSize,
  getRailyardAssetFileType,
  resolveRailyardReleaseAssetInfo,
} from "@/features/railyard/railyard-downloads";
import type {
  RailyardDownloadOS,
  RailyardDownloadOption,
} from "@/features/railyard/railyard-types";

const allOsOptions: RailyardDownloadOS[] = ["windows", "macos", "linux"];

const osLabelById: Record<RailyardDownloadOS, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

type RailyardDownloadsPickerProps = {
  options: RailyardDownloadOption[];
};

export function RailyardDownloadsPicker({ options }: RailyardDownloadsPickerProps) {
  const [selectedOs, setSelectedOs] = useState<RailyardDownloadOS>("windows");
  const [releaseAssetInfoByName, setReleaseAssetInfoByName] = useState<
    Record<string, { downloadUrl: string; sizeBytes: number }>
  >({});

  const visibleOptions = useMemo(
    () => options.filter((option) => option.os === selectedOs),
    [options, selectedOs],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let cancelled = false;

    void detectRailyardPlatformAccurate(window.navigator).then((detected) => {
      if (cancelled || detected.os === "unknown") {
        return;
      }

      setSelectedOs(detected.os);
    });

    return () => {
      cancelled = true;
    };
  }, [options]);

  useEffect(() => {
    let cancelled = false;

    void fetchRailyardReleaseAssetInfo()
      .then((assetInfo) => {
        if (!cancelled) {
          setReleaseAssetInfoByName(assetInfo);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReleaseAssetInfoByName({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SectionShell className="scroll-mt-18">
      <div id="all-downloads">
        <SectionHeader title="All Downloads" className="mb-8" />

        <Card className="overflow-hidden rounded-2xl border-border/45 bg-background shadow-md lg:rounded-3xl">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="shrink-0 border-b border-border/45 bg-background p-2.5 lg:w-52 lg:border-b-0 lg:border-r">
                <div className="flex flex-col gap-2.5">
                  {allOsOptions.map((os) => {
                    const isSelected = os === selectedOs;
                    return (
                      <Button
                        key={os}
                        type="button"
                        variant="ghost"
                        className={[
                          "h-11 w-full justify-start rounded-xl px-4 text-sm font-medium transition-all",
                          isSelected
                            ? "bg-[color-mix(in_srgb,var(--suite-accent-light)_18%,transparent)] text-[var(--suite-accent-light)] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--suite-accent-light)_38%,transparent)] dark:bg-[color-mix(in_srgb,var(--suite-accent-dark)_24%,transparent)] dark:text-[var(--suite-accent-dark)] dark:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--suite-accent-dark)_44%,transparent)]"
                            : "text-muted-foreground hover:bg-[color-mix(in_srgb,var(--suite-accent-light)_14%,transparent)] hover:text-[var(--suite-accent-light)] dark:hover:bg-[color-mix(in_srgb,var(--suite-accent-dark)_18%,transparent)] dark:hover:text-[var(--suite-accent-dark)]",
                        ].join(" ")}
                        onClick={() => setSelectedOs(os)}
                      >
                        {osLabelById[os]}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 space-y-2.5 bg-background px-4 pb-4 pt-2.5 sm:px-5 sm:pb-5 sm:pt-2.5">
                {visibleOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/45 bg-muted/20 p-5 text-sm text-muted-foreground">
                    No downloads are currently available for {osLabelById[selectedOs]}.
                  </div>
                ) : (
                  visibleOptions.map((option) => {
                    const githubAsset = resolveRailyardReleaseAssetInfo(
                      releaseAssetInfoByName,
                      option.assetName,
                    );
                    const href = githubAsset?.downloadUrl ?? "#";
                    const fileType = getRailyardAssetFileType(option.assetName);
                    const fileSize = formatRailyardAssetSize(githubAsset?.sizeBytes);

                    return (
                      <a
                        key={`${option.os}-${option.arch}-${option.assetName}`}
                        href={href}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-border/45 bg-card px-4 py-0 transition-all duration-200 hover:border-border/70 hover:bg-muted/25"
                      >
                        <div className="flex min-h-12 min-w-0 items-center gap-2.5">
                          <span className="truncate text-sm font-medium text-foreground">
                            {option.label}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {fileType} · {fileSize}
                          </span>
                        </div>
                        <ArrowRight
                          className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden={true}
                        />
                      </a>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  );
}
