import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@subway-builder-modded/shared-ui";

type OpenInRailyardDialogProps = {
  open: boolean;
  itemName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function OpenInRailyardDialog({
  open,
  itemName,
  onOpenChange,
  onConfirm,
}: OpenInRailyardDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Open in Railyard</DialogTitle>
          <DialogDescription>Open {itemName} in the Railyard app.</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <a
            href="/railyard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Install Railyard
          </a>
          <Button type="button" onClick={onConfirm}>
            Open Railyard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
