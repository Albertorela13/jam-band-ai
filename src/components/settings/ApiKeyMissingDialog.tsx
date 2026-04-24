import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKeyMissingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export function ApiKeyMissingDialog({ open, onOpenChange, onOpenSettings }: ApiKeyMissingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <DialogTitle className="font-display text-2xl">
            Add your API key to start asking users
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Head to Settings and add your Anthropic API key. It lives in your browser only.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-[10px]">
            Not now
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onOpenSettings();
            }}
            className="rounded-[10px]"
          >
            Open Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
