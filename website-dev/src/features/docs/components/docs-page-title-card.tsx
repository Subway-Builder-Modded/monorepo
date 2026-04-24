import { PageHeading } from "@subway-builder-modded/shared-ui";
import { FileText } from "lucide-react";

type DocsPageTitleCardProps = {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }> | null;
};

export function DocsPageTitleCard({ title, description, icon: Icon }: DocsPageTitleCardProps) {
  return (
    <PageHeading
      icon={(Icon ?? FileText) as typeof FileText}
      title={title}
      description={description}
      className="mb-4"
    />
  );
}
