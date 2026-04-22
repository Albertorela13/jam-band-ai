import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Stub for Stage 1. Real content (API key, model, data ops) lands in Stage 3.
 */
export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
          <DialogDescription>
            API key, model picker, and data tools land here in the next stage.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-dashed border-border bg-subtle p-6 text-sm text-muted-foreground">
          Coming up next: paste your Anthropic API key, pick a model, export or import your panel.
        </div>
      </DialogContent>
    </Dialog>
  );
}
