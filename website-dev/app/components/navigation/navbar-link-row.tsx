import type { SiteNavItem } from "@/app/config/site-navigation";
import { Link } from "@/app/lib/router";
import { NavRow } from "@subway-builder-modded/shared-ui";

type NavbarLinkRowProps = {
  active: boolean;
  className?: string;
  item: SiteNavItem;
  onClick: () => void;
};

export function NavbarLinkRow({ active, className, item, onClick }: NavbarLinkRowProps) {
  const ItemIcon = item.icon;

  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <NavRow
        title={item.title}
        description={item.description}
        icon={<ItemIcon className="size-5" aria-hidden={true} />}
        active={active}
        className={className}
      />
    </Link>
  );
}
