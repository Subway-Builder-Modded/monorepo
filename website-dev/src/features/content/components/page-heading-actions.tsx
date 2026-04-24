import type { ResolvedHeadingActionConfig } from "@/config/shared/heading-actions";
import { UtilityActionLink } from "./utility-action";

type PageHeadingActionsProps = {
  actions: ResolvedHeadingActionConfig[];
  hideOnSmall?: boolean;
};

export function PageHeadingActions({ actions, hideOnSmall = false }: PageHeadingActionsProps) {
  if (actions.length === 0) {
    return null;
  }

  const content = (
    <div className="flex flex-col items-end gap-1">
      {actions.map((action) => (
        <UtilityActionLink
          key={`${action.label}-${action.href}`}
          href={action.href}
          label={action.label}
          icon={action.icon}
          external={action.external}
        />
      ))}
    </div>
  );

  if (hideOnSmall) {
    return <div className="hidden shrink-0 sm:block">{content}</div>;
  }

  return content;
}
