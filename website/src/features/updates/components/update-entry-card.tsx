import { DirectoryCard } from "@subway-builder-modded/shared-ui";
import { resolveIcon } from "@subway-builder-modded/icons";
import { Link } from "@/lib/router";
import { getUpdatePageUrl } from "@/features/updates/lib/routing";
import type { UpdatesFrontmatter, UpdatesSuiteId } from "@/config/updates";
import { LatestReleaseChip, TagChip } from "./tag-badges";

type UpdateEntryCardEntry = {
  id: string;
  suiteId: UpdatesSuiteId;
  frontmatter: Pick<UpdatesFrontmatter, "title" | "tag" | "icon" | "date">;
};

type UpdateEntryCardProps = {
  entry: UpdateEntryCardEntry;
  isLatest: boolean;
};

export function UpdateEntryCard({ entry, isLatest }: UpdateEntryCardProps) {
  const Icon = resolveIcon(entry.frontmatter.icon);
  const title = entry.frontmatter.title.trim().replace(/^.+\s-\s(v[\w.+-]+)$/i, "$1");

  return (
    <DirectoryCard
      asChild
      alignment="center"
      icon={<Icon className="size-[clamp(1rem,1.5vw,1.25rem)]" aria-hidden={true} />}
      heading={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base font-bold leading-tight text-foreground">{title}</span>
          <TagChip tag={entry.frontmatter.tag} />
          {isLatest ? <LatestReleaseChip /> : null}
        </span>
      }
      description={entry.frontmatter.date}
      descriptionClassName="text-xs"
    >
      <Link to={getUpdatePageUrl(entry.suiteId, entry.id)}>{null}</Link>
    </DirectoryCard>
  );
}
