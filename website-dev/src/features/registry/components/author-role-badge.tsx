import { useEffect, useState, type CSSProperties } from "react";
import { ExternalLink } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@subway-builder-modded/shared-ui";
import { getTierStyle } from "@/features/credits/lib/tier-styles";
import {
  resolveRegistryAuthorRole,
  type RegistryAuthorRole,
} from "@/features/registry/lib/author-roles";
import { Link } from "@/lib/router";

type AuthorRoleBadgeProps = {
  authorId: string | null | undefined;
  className?: string;
};

const ROLE_LABEL_BY_TIER: Record<RegistryAuthorRole["tier"], string> = {
  developer: "Developer",
  collaborator: "Collaborator",
  executive: "Executive",
  conductor: "Conductor",
  engineer: "Engineer",
};

function resolveRoleMetadata(role: RegistryAuthorRole): {
  label: string;
  href: "/credits" | "/contribute";
} {
  if (role.kind === "maintainer") {
    return { label: ROLE_LABEL_BY_TIER[role.tier], href: "/credits" };
  }

  return { label: ROLE_LABEL_BY_TIER[role.tier], href: "/contribute" };
}

export function AuthorRoleBadge({ authorId, className }: AuthorRoleBadgeProps) {
  const [role, setRole] = useState<RegistryAuthorRole | null>(null);

  useEffect(() => {
    let isDisposed = false;

    void resolveRegistryAuthorRole(authorId).then((resolvedRole) => {
      if (!isDisposed) {
        setRole(resolvedRole);
      }
    });

    return () => {
      isDisposed = true;
    };
  }, [authorId]);

  if (!role) {
    return null;
  }

  const tierStyle = getTierStyle(role.tier);
  const RoleIcon = tierStyle.icon;
  const metadata = resolveRoleMetadata(role);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={metadata.href}
            className={`inline-flex items-center justify-center text-[length:inherit] leading-none no-underline hover:no-underline ${
              className ?? ""
            }`}
            aria-label={`${metadata.label} role`}
          >
            <RoleIcon
              className="size-[1em]"
              aria-hidden={true}
              style={{ color: tierStyle.accentLight }}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="px-2.5 py-1.5">
          <Link
            to={metadata.href}
            className="inline-flex items-center gap-1.5 text-sm text-foreground no-underline transition-colors hover:text-[var(--role-accent)] hover:underline"
            style={{ "--role-accent": tierStyle.accentLight } as CSSProperties}
          >
            <span>{metadata.label}</span>
            <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden={true} />
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
