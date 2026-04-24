import { Plus } from "lucide-react";

interface AddPersonaCardProps {
  onClick: () => void;
}

export function AddPersonaCard({ onClick }: AddPersonaCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-transparent p-8 text-center transition-all duration-200 ease-bounce hover:scale-[1.02] hover:border-primary hover:bg-primary/5"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-subtle text-muted-foreground transition-colors group-hover:bg-primary/20 group-hover:text-foreground">
        <Plus className="h-6 w-6" strokeWidth={2.25} />
      </span>
      <div>
        <p className="font-display text-lg font-semibold text-foreground">Add persona</p>
        <p className="mt-1 text-sm text-muted-foreground">Add another voice to your panel.</p>
      </div>
    </button>
  );
}
