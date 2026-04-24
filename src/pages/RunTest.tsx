import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useAppDialogs } from "@/components/layout/AppDialogs";
import { getAvatarUrl } from "@/lib/avatar";
import {
  AnthropicAuthError,
  AnthropicRateLimitError,
  InvalidJsonResponseError,
  runPersonaReaction,
} from "@/lib/anthropic";
import {
  getPersonas,
  newId,
  saveTest,
  type Persona,
  type Test,
  type TestPersonaResult,
} from "@/lib/storage";

type PersonaRunStatus = "pending" | "running" | "done" | "error";

interface RunRow {
  persona: Persona;
  status: PersonaRunStatus;
  error?: string;
}

const MIN_FEATURE_LENGTH = 20;

const RunTest = () => {
  const navigate = useNavigate();
  const { ensureApiKey } = useAppDialogs();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [feature, setFeature] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [runRows, setRunRows] = useState<RunRow[]>([]);

  useEffect(() => {
    const all = getPersonas();
    setPersonas(all);
    setSelectedIds(new Set(all.map((p) => p.id)));
  }, []);

  const featureTrimmed = feature.trim();
  const featureValid = featureTrimmed.length >= MIN_FEATURE_LENGTH;
  const selectedPersonas = useMemo(
    () => personas.filter((p) => selectedIds.has(p.id)),
    [personas, selectedIds],
  );
  const canRun = !running && featureValid && selectedPersonas.length > 0;

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = runRows.filter((r) => r.status === "done").length;
  const totalCount = runRows.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const handleRun = async () => {
    if (!canRun) return;
    if (!ensureApiKey()) return;

    setRunning(true);
    const initialRows: RunRow[] = selectedPersonas.map((p) => ({ persona: p, status: "pending" }));
    setRunRows(initialRows);

    const results: TestPersonaResult[] = [];

    for (let i = 0; i < selectedPersonas.length; i++) {
      const persona = selectedPersonas[i];
      setRunRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)),
      );

      try {
        const result = await runPersonaReaction(persona, featureTrimmed);
        results.push(result);
        setRunRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "done" } : r)),
        );
      } catch (err) {
        let message = "Something went sideways. Try again?";
        if (err instanceof AnthropicAuthError) message = err.message;
        else if (err instanceof AnthropicRateLimitError) message = err.message;
        else if (err instanceof InvalidJsonResponseError) message = err.message;
        else if (err instanceof Error) message = err.message;

        setRunRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "error", error: message } : r)),
        );
        toast.error(`${persona.name} couldn't weigh in`, { description: message });
        setRunning(false);
        return;
      }
    }

    const panelScore =
      results.length === 0
        ? 0
        : Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

    const test: Test = {
      id: newId(),
      feature_description: featureTrimmed,
      persona_ids: selectedPersonas.map((p) => p.id),
      results,
      panel_score: panelScore,
      created_at: new Date().toISOString(),
    };

    saveTest(test);
    toast.success("Panel's weighed in.");
    setRunning(false);
    navigate(`/test/${test.id}`);
  };

  if (personas.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-10 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Your panel is empty
        </h1>
        <p className="text-muted-foreground">
          Add at least one persona before running a session.
        </p>
        <Button size="lg" onClick={() => navigate("/persona/new")} className="rounded-[10px]">
          Create your first persona
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <button
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          disabled={running}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Panel
        </button>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Run a session
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Describe what you're testing. Your panel will react in character.
        </p>
      </div>

      {/* Feature input */}
      <section className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-warm">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="feature" className="font-display text-lg font-semibold">
            What feature should the panel react to?
          </label>
          <span className="text-xs text-muted-foreground">
            {featureTrimmed.length}/{MIN_FEATURE_LENGTH}+
          </span>
        </div>
        <Textarea
          id="feature"
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          placeholder="e.g. A weekly digest email summarising every conversation a sales rep had, with auto-generated next steps and a one-click 'send to CRM' button..."
          rows={6}
          disabled={running}
          className="resize-none rounded-xl bg-background"
        />
        <p className="text-xs text-muted-foreground">
          Be specific — describe the behaviour, not just the name. Personas react better to detail.
        </p>
      </section>

      {/* Persona picker */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">Who's on the panel?</h2>
          <span className="text-sm text-muted-foreground">
            {selectedPersonas.length} of {personas.length} selected
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {personas.map((persona) => {
            const checked = selectedIds.has(persona.id);
            return (
              <label
                key={persona.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all duration-200 ease-bounce ${
                  checked
                    ? "border-primary bg-primary/10 shadow-warm"
                    : "border-border bg-card hover:border-primary/40"
                } ${running ? "pointer-events-none opacity-60" : ""}`}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleSelected(persona.id)}
                  disabled={running}
                  aria-label={`Include ${persona.name}`}
                />
                <img
                  src={getAvatarUrl(persona.avatar_seed ?? persona.id)}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full bg-subtle"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{persona.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{persona.role}</p>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Run button + live progress */}
      <section className="space-y-4">
        {running && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">
                Session in progress…
              </span>
              <span className="text-muted-foreground">
                {completedCount} of {totalCount} done
              </span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <ul className="space-y-2 pt-1">
              {runRows.map((row) => (
                <li
                  key={row.persona.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <StatusIcon status={row.status} />
                  <span
                    className={
                      row.status === "done"
                        ? "text-foreground"
                        : row.status === "running"
                          ? "font-medium text-foreground"
                          : row.status === "error"
                            ? "text-destructive"
                            : "text-muted-foreground"
                    }
                  >
                    {row.persona.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {row.status === "running" && "thinking…"}
                    {row.status === "pending" && "waiting"}
                    {row.status === "done" && "weighed in"}
                    {row.status === "error" && (row.error ?? "failed")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {!featureValid && !running && featureTrimmed.length > 0 && (
            <p className="text-sm text-muted-foreground">
              A few more words and we're good to go.
            </p>
          )}
          <Button
            size="lg"
            onClick={handleRun}
            disabled={!canRun}
            className="rounded-[10px] px-7 text-base transition-transform duration-200 ease-bounce enabled:hover:scale-[1.02]"
          >
            {running ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run session
              </>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
};

function StatusIcon({ status }: { status: PersonaRunStatus }) {
  if (status === "running")
    return <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />;
  if (status === "done")
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    );
  if (status === "error")
    return <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />;
  return <span className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />;
}

export default RunTest;
