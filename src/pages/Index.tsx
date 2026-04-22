import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PersonaCard } from "@/components/panel/PersonaCard";
import { AddPersonaCard } from "@/components/panel/AddPersonaCard";
import { PanelEmptyState } from "@/components/panel/PanelEmptyState";
import { getPersonas, MAX_PERSONAS, type Persona } from "@/lib/storage";

const Index = () => {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    setPersonas(getPersonas());
  }, []);

  const isEmpty = personas.length === 0;
  const isFull = personas.length >= MAX_PERSONAS;
  const canRunSession = personas.length > 0;

  const handleAddPersona = () => {
    if (isFull) {
      toast("Six bandmates max — any more and it stops being a jam session.");
      return;
    }
    navigate("/persona/new");
  };

  const runButton = (
    <Button
      size="lg"
      disabled={!canRunSession}
      onClick={() => navigate("/test/new")}
      className="rounded-[10px] px-6 text-base transition-transform duration-200 ease-bounce hover:scale-[1.02] disabled:opacity-50"
    >
      Run a jam session
      <ArrowRight className="h-4 w-4" />
    </Button>
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Your Panel
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Up to six user personas ready to jam on your next feature.
          </p>
        </div>

        {!isEmpty && (
          canRunSession ? (
            runButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{runButton}</span>
              </TooltipTrigger>
              <TooltipContent>Add a persona first</TooltipContent>
            </Tooltip>
          )
        )}
      </header>

      {isEmpty ? (
        <PanelEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
          {!isFull && <AddPersonaCard onClick={handleAddPersona} />}
        </div>
      )}
    </div>
  );
};

export default Index;
