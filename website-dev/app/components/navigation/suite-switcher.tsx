import { NavDropdown, type NavDropdownOption } from "@subway-builder-modded/shared-ui";
import { cn } from "@/app/lib/utils";

type SuiteSwitcherProps = {
  compact?: boolean;
  options: NavDropdownOption[];
  selectedId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
};

export function SuiteSwitcher({
  compact = false,
  options,
  selectedId,
  isOpen,
  onOpenChange,
  onSelect,
}: SuiteSwitcherProps) {
  return (
    <NavDropdown
      options={options}
      selectedId={selectedId}
      hideSelectedLabel={compact}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      triggerLabel="Select suite"
      className="w-full"
      triggerClassName={cn("w-full justify-start px-0", compact && "w-auto gap-1.5")}
      menuClassName="border border-border"
    />
  );
}
