import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, RotateCcw, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PanelScoreRing } from "@/components/test/PanelScoreRing";
import { PersonaResultCard } from "@/components/test/PersonaResultCard";
import { getPersonas, getTest, type Persona, type Test } from "@/lib/storage";

const TestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | undefined>(undefined);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setTest(getTest(id));
    setPersonas(getPersonas());
    setLoading(false);
  }, [id]);

  const personaById = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-muted-foreground">
        Loading the jam…
      </div>
    );
  }

  if (!test) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          That jam's gone missing
        </h1>
        <p className="text-muted-foreground">
          We couldn't find a session with that id. It may have been deleted.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={() => navigate("/history")} className="rounded-[10px]">
            Back to history
          </Button>
          <Button onClick={() => navigate("/test/new")} className="rounded-[10px]">
            Run a new jam
          </Button>
        </div>
      </div>
    );
  }

  const created = new Date(test.created_at);
  const dateLabel = created.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-12">
      <button
        onClick={() => navigate("/history")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to history
      </button>

      {/* Hero */}
      <header className="rounded-2xl border border-border bg-card p-7 shadow-warm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {test.results.length} {test.results.length === 1 ? "persona" : "personas"} weighed in
              </span>
            </div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              The jam
            </h1>
            <blockquote className="border-l-[3px] border-primary pl-4 text-base leading-relaxed text-foreground/90">
              {test.feature_description}
            </blockquote>
          </div>
          <div className="shrink-0">
            <PanelScoreRing score={test.panel_score} />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            variant="outline"
            onClick={() => navigate("/test/new")}
            className="rounded-[10px]"
          >
            <RotateCcw className="h-4 w-4" />
            Run another jam
          </Button>
        </div>
      </header>

      {/* Per-persona results */}
      <section className="space-y-5">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          What the panel said
        </h2>
        <div className="space-y-5">
          {test.results.map((result) => (
            <PersonaResultCard
              key={result.persona_id}
              persona={personaById.get(result.persona_id)}
              result={result}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default TestDetail;
