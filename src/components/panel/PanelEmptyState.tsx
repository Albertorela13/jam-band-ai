import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyStageIllustration } from "@/components/panel/EmptyStageIllustration";

export function PanelEmptyState() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 rounded-2xl border border-border bg-card px-8 py-16 text-center shadow-warm">
      <EmptyStageIllustration className="h-44 w-full max-w-sm" />
      <div className="space-y-2">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Your panel is empty.</h2>
        <p className="text-base text-muted-foreground">Add your first persona to start asking users.</p>
      </div>
      <Button
        size="lg"
        onClick={() => navigate("/persona/new")}
        className="rounded-[10px] px-6 transition-transform duration-200 ease-bounce hover:scale-[1.02]"
      >
        Add your first persona
      </Button>
    </div>
  );
}
