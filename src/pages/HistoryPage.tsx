import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, History as HistoryIcon, Music2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ReactionBadge } from "@/components/test/ReactionBadge";
import { getAvatarUrl } from "@/lib/avatar";
import { getPersonas, getTests, type Persona, type Test } from "@/lib/storage";

const HistoryPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  useEffect(() => {
    setTests(getTests());
    setPersonas(getPersonas());
  }, []);

  const personaById = useMemo(() => {
    const map = new Map<string, Persona>();
    personas.forEach((p) => map.set(p.id, p));
    return map;
  }, [personas]);

  const isEmpty = tests.length === 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Jam history
          </h1>
          <p className="max-w-xl text-base text-muted-foreground">
            Every session your panel has weighed in on, newest first.
          </p>
        </div>
        {!isEmpty && (
          <Button
            size="lg"
            onClick={() => navigate("/test/new")}
            className="rounded-[10px] px-6 text-base transition-transform duration-200 ease-bounce hover:scale-[1.02]"
          >
            <Music2 className="h-4 w-4" />
            Run a new jam
          </Button>
        )}
      </header>

      {isEmpty ? (
        <EmptyState onRun={() => navigate("/test/new")} hasPersonas={personas.length > 0} onCreate={() => navigate("/persona/new")} />
      ) : (
        <ul className="space-y-4">
          {tests.map((test) => (
            <TestRow
              key={test.id}
              test={test}
              personaById={personaById}
              onOpen={() => navigate(`/test/${test.id}`)}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

function TestRow({
  test,
  personaById,
  onOpen,
}: {
  test: Test;
  personaById: Map<string, Persona>;
  onOpen: () => void;
}) {
  const created = new Date(test.created_at);
  const dateLabel = created.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeLabel = created.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  // Top reaction tally
  const tally: Record<string, number> = {};
  test.results.forEach((r) => {
    tally[r.reaction] = (tally[r.reaction] ?? 0) + 1;
  });
  const topReaction = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] as
    | "loves"
    | "likes"
    | "mixed"
    | "rejects"
    | undefined;

  const scoreToneClass =
    test.panel_score >= 70
      ? "text-success"
      : test.panel_score >= 45
        ? "text-foreground"
        : test.panel_score >= 25
          ? "text-warning"
          : "text-destructive";

  return (
    <li>
      <button
        onClick={onOpen}
        className="group flex w-full items-stretch gap-5 rounded-2xl border border-border bg-card p-5 text-left shadow-warm transition-all duration-200 ease-bounce hover:scale-[1.005] hover:shadow-warm-lg"
      >
        {/* Score */}
        <div className="flex w-20 shrink-0 flex-col items-center justify-center rounded-xl bg-subtle/60 px-2 py-3">
          <span className={`font-display text-3xl font-semibold leading-none ${scoreToneClass}`}>
            {test.panel_score}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            score
          </span>
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              {dateLabel} · {timeLabel}
            </span>
            {topReaction && <ReactionBadge reaction={topReaction} size="sm" />}
          </div>
          <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">
            {test.feature_description}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <PersonaStack
              personaIds={test.persona_ids}
              personaById={personaById}
              fallbackCount={test.results.length}
            />
            <span className="text-xs text-muted-foreground">
              {test.results.length} {test.results.length === 1 ? "voice" : "voices"}
            </span>
          </div>
        </div>

        {/* Affordance */}
        <div className="flex shrink-0 items-center text-muted-foreground transition-colors group-hover:text-foreground">
          <ArrowRight className="h-5 w-5" />
        </div>
      </button>
    </li>
  );
}

function PersonaStack({
  personaIds,
  personaById,
  fallbackCount,
}: {
  personaIds: string[];
  personaById: Map<string, Persona>;
  fallbackCount: number;
}) {
  const ids = personaIds.length > 0 ? personaIds : new Array(fallbackCount).fill("?");
  const visible = ids.slice(0, 4);
  const extra = ids.length - visible.length;
  return (
    <div className="flex -space-x-2">
      {visible.map((id, i) => {
        const persona = personaById.get(id);
        const seed = persona?.avatar_seed ?? persona?.id ?? id ?? `unknown-${i}`;
        return (
          <img
            key={`${id}-${i}`}
            src={getAvatarUrl(seed)}
            alt=""
            className="h-7 w-7 rounded-full border-2 border-card bg-subtle"
            loading="lazy"
          />
        );
      })}
      {extra > 0 && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-subtle text-[10px] font-semibold text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}

function EmptyState({
  onRun,
  onCreate,
  hasPersonas,
}: {
  onRun: () => void;
  onCreate: () => void;
  hasPersonas: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <HistoryIcon className="h-7 w-7" strokeWidth={2} />
      </span>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          No jams yet
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {hasPersonas
            ? "Run your first session and the panel's reactions will land here."
            : "Build a persona, then run a session — past jams will live here."}
        </p>
      </div>
      <Button
        size="lg"
        onClick={hasPersonas ? onRun : onCreate}
        className="rounded-[10px] px-6 transition-transform duration-200 ease-bounce hover:scale-[1.02]"
      >
        {hasPersonas ? (
          <>
            <Music2 className="h-4 w-4" />
            Start a jam
          </>
        ) : (
          "Create your first persona"
        )}
      </Button>
    </div>
  );
}

export default HistoryPage;
