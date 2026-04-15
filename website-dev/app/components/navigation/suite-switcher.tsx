import { NavDropdown, type NavDropdownOption } from "@subway-builder-modded/shared-ui";

type SuiteSwitcherProps = {
  options: NavDropdownOption[];
  selectedId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
};

export function SuiteSwitcher({
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
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onSelect={onSelect}
      triggerLabel="Select suite"
      className="w-full"
      triggerClassName="w-full justify-start px-0"
      menuClassName="border border-border"
    />
  );
}
