import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@subway-builder-modded/shared-ui";
import { formatRegistryDate } from "@/features/registry/detail/lib/format-registry-date";
import type { RegistryDetailVersion } from "@/features/registry/detail/registry-detail-types";

type VersionsTabProps = {
  versions: RegistryDetailVersion[];
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDownloads(value: number | null): string {
  if (value === null || value === undefined) {
    return "\u2014";
  }
  return numberFormatter.format(value);
}

export function VersionsTab({ versions }: VersionsTabProps) {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No published versions are available.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Version</TableHead>
              <TableHead>Release Date</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((version) => (
              <TableRow key={version.version}>
                <TableCell className="font-medium text-foreground">{version.version}</TableCell>
                <TableCell>{formatRegistryDate(version.releaseDate)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDownloads(version.downloads)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-2 md:hidden">
        {versions.map((version) => (
          <article
            key={version.version}
            className="rounded-lg border border-border/70 bg-card px-3 py-2"
          >
            <dl className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-medium text-foreground">{version.version}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Release Date</dt>
                <dd>{formatRegistryDate(version.releaseDate)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Downloads</dt>
                <dd className="tabular-nums">{formatDownloads(version.downloads)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}
