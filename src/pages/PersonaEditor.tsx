import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, Trash2, Plus, X, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppDialogs } from "@/components/layout/AppDialogs";
import { getAvatarUrl } from "@/lib/avatar";
import {
  deletePersona,
  getPersona,
  getPersonas,
  MAX_PERSONAS,
  newId,
  PanelFullError,
  savePersona,
  type Persona,
} from "@/lib/storage";
import {
  AnthropicAuthError,
  AnthropicRateLimitError,
  InvalidJsonResponseError,
  structurePersona,
} from "@/lib/anthropic";

type Mode = "describe" | "review";

const EXAMPLE_PROMPT = `Rachel, Head of People at a 120-person SaaS company. Drowning in disconnected HR tools — one for payroll, one for performance, one for onboarding. Wants a single source of truth but is burned by past "all-in-one" platforms that did everything badly. Lives in Slack and Notion. Skeptical of AI features bolted onto HR software.`;

const PersonaEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { ensureApiKey } = useAppDialogs();

  const isEditing = Boolean(id);
  const existing = useMemo(() => (id ? getPersona(id) : undefined), [id]);

  // Redirect if editing an unknown id
  useEffect(() => {
    if (id && !existing) {
      toast("That persona isn't in your panel anymore.");
      navigate("/", { replace: true });
    }
  }, [id, existing, navigate]);

  const [mode, setMode] = useState<Mode>(isEditing ? "review" : "describe");
  const [description, setDescription] = useState(existing?.source_text ?? "");
  const [isStructuring, setIsStructuring] = useState(false);

  // Structured fields
  const [name, setName] = useState(existing?.name ?? "");
  const [role, setRole] = useState(existing?.role ?? "");
  const [company, setCompany] = useState(existing?.company ?? "");
  const [goals, setGoals] = useState<string[]>(existing?.goals ?? []);
  const [painPoints, setPainPoints] = useState<string[]>(existing?.pain_points ?? []);
  const [behaviour, setBehaviour] = useState(existing?.behaviour ?? "");
  const [voice, setVoice] = useState(existing?.voice ?? "");
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [gaps, setGaps] = useState<string[]>(existing?.gaps ?? []);
  const [avatarSeed, setAvatarSeed] = useState(existing?.avatar_seed ?? existing?.id ?? newId());

  const [confirmDelete, setConfirmDelete] = useState(false);

  const canStructure = description.trim().length >= 20 && !isStructuring;

  const handleStructure = async () => {
    if (!ensureApiKey()) return;
    if (!canStructure) return;

    // Enforce panel cap before spending an API call
    if (!isEditing && getPersonas().length >= MAX_PERSONAS) {
      toast("Six personas max — keeps the panel focused.");
      return;
    }

    setIsStructuring(true);
    try {
      const result = await structurePersona(description.trim());
      setName(result.name);
      setRole(result.role);
      setCompany(result.company);
      setGoals(result.goals);
      setPainPoints(result.pain_points);
      setBehaviour(result.behaviour);
      setVoice(result.voice);
      setQuote(result.quote);
      setGaps(result.gaps);
      // Seed avatar from name for stable look unless user reseeds
      if (!isEditing) setAvatarSeed(result.name || avatarSeed);
      setMode("review");
      toast.success("Persona structured. Tweak anything that feels off.");
    } catch (err) {
      if (err instanceof AnthropicAuthError) {
        toast.error("That key didn't work. Check it in Settings.");
      } else if (err instanceof AnthropicRateLimitError) {
        toast.error("You've hit Anthropic's rate limit. Give it a minute.");
      } else if (err instanceof InvalidJsonResponseError) {
        toast.error("The model gave us something weird. Try again?");
      } else {
        toast.error(err instanceof Error ? err.message : "Couldn't structure that persona.");
      }
    } finally {
      setIsStructuring(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("A persona needs a name.");
      return;
    }
    if (!role.trim()) {
      toast.error("A persona needs a role.");
      return;
    }

    const persona: Persona = {
      id: existing?.id ?? newId(),
      name: name.trim(),
      role: role.trim(),
      company: company.trim(),
      goals: goals.map((g) => g.trim()).filter(Boolean),
      pain_points: painPoints.map((p) => p.trim()).filter(Boolean),
      behaviour: behaviour.trim(),
      voice: voice.trim(),
      quote: quote.trim(),
      gaps: gaps.map((g) => g.trim()).filter(Boolean),
      source_text: description.trim() || existing?.source_text,
      avatar_seed: avatarSeed,
      created_at: existing?.created_at ?? new Date().toISOString(),
    };

    try {
      savePersona(persona);
      toast.success(isEditing ? "Persona updated." : `${persona.name} joined the panel.`);
      navigate("/");
    } catch (err) {
      if (err instanceof PanelFullError) {
        toast.error("Six personas max — keeps the panel focused.");
      } else {
        toast.error("Couldn't save. Try again?");
      }
    }
  };

  const handleDelete = () => {
    if (!existing) return;
    deletePersona(existing.id);
    toast(`${existing.name} removed from your panel.`);
    navigate("/");
  };

  const reseedAvatar = () => setAvatarSeed(newId());

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="-ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to panel
        </Button>

        {isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <header className="space-y-2">
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          {isEditing ? "Edit persona" : "New persona"}
        </h1>
        <p className="text-muted-foreground">
          {mode === "describe"
            ? "Sketch them in your own words. Claude will pull out the structure."
            : "Review and tweak. This is what the persona will use to react to your features."}
        </p>
      </header>

      {mode === "describe" ? (
        <DescribeStep
          description={description}
          onChange={setDescription}
          onStructure={handleStructure}
          canStructure={canStructure}
          isStructuring={isStructuring}
          onSkip={() => setMode("review")}
        />
      ) : (
        <ReviewStep
          avatarSeed={avatarSeed}
          onReseedAvatar={reseedAvatar}
          name={name}
          setName={setName}
          role={role}
          setRole={setRole}
          company={company}
          setCompany={setCompany}
          goals={goals}
          setGoals={setGoals}
          painPoints={painPoints}
          setPainPoints={setPainPoints}
          behaviour={behaviour}
          setBehaviour={setBehaviour}
          voice={voice}
          setVoice={setVoice}
          quote={quote}
          setQuote={setQuote}
          gaps={gaps}
          setGaps={setGaps}
        />
      )}

      {mode === "review" && (
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => setMode("describe")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to description
          </Button>
          <Button
            size="lg"
            onClick={handleSave}
            className="rounded-[10px] px-6 transition-transform duration-200 ease-bounce hover:scale-[1.02]"
          >
            {isEditing ? "Save changes" : "Add to panel"}
          </Button>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {existing?.name ?? "this persona"}?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll leave the panel. Past test results that mention them stay put.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ---------------- Step 1: Describe ---------------- */

function DescribeStep({
  description,
  onChange,
  onStructure,
  canStructure,
  isStructuring,
  onSkip,
}: {
  description: string;
  onChange: (v: string) => void;
  onStructure: () => void;
  canStructure: boolean;
  isStructuring: boolean;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="persona-description" className="text-sm font-medium">
          Describe the persona
        </Label>
        <Textarea
          id="persona-description"
          value={description}
          onChange={(e) => onChange(e.target.value)}
          placeholder={EXAMPLE_PROMPT}
          rows={10}
          className="resize-y rounded-xl border-border/80 bg-card text-base leading-relaxed shadow-warm focus-visible:ring-primary/40"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {description.trim().length < 20
              ? "A sentence or two minimum."
              : `${description.trim().length} characters — looking good.`}
          </span>
          <button
            type="button"
            onClick={() => onChange(EXAMPLE_PROMPT)}
            className="text-primary hover:underline"
          >
            Use the example
          </button>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Skip — I'll fill the fields myself
        </button>
        <Button
          size="lg"
          onClick={onStructure}
          disabled={!canStructure}
          className="rounded-[10px] px-6 transition-transform duration-200 ease-bounce hover:scale-[1.02]"
        >
          {isStructuring ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Structuring…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Structure with Claude
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* ---------------- Step 2: Review ---------------- */

function ReviewStep(props: {
  avatarSeed: string;
  onReseedAvatar: () => void;
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
  company: string;
  setCompany: (v: string) => void;
  goals: string[];
  setGoals: (v: string[]) => void;
  painPoints: string[];
  setPainPoints: (v: string[]) => void;
  behaviour: string;
  setBehaviour: (v: string) => void;
  voice: string;
  setVoice: (v: string) => void;
  quote: string;
  setQuote: (v: string) => void;
  gaps: string[];
  setGaps: (v: string[]) => void;
}) {
  const {
    avatarSeed,
    onReseedAvatar,
    name,
    setName,
    role,
    setRole,
    company,
    setCompany,
    goals,
    setGoals,
    painPoints,
    setPainPoints,
    behaviour,
    setBehaviour,
    voice,
    setVoice,
    quote,
    setQuote,
    gaps,
    setGaps,
  } = props;

  return (
    <div className="space-y-8">
      {/* Identity */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-warm">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-2">
            <img
              src={getAvatarUrl(avatarSeed)}
              alt={`Avatar for ${name || "persona"}`}
              className="h-24 w-24 rounded-full bg-subtle"
            />
            <button
              type="button"
              onClick={onReseedAvatar}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-3 w-3" />
              Reroll
            </button>
          </div>

          <div className="flex-1 space-y-3">
            <FieldRow label="Name" htmlFor="p-name">
              <Input
                id="p-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rachel"
                maxLength={80}
              />
            </FieldRow>
            <FieldRow label="Role" htmlFor="p-role">
              <Input
                id="p-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Head of People"
                maxLength={120}
              />
            </FieldRow>
            <FieldRow label="Company" htmlFor="p-company">
              <Input
                id="p-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="120-person SaaS"
                maxLength={160}
              />
            </FieldRow>
          </div>
        </div>
      </section>

      {/* Quote */}
      <FieldRow label="Quote" htmlFor="p-quote" hint="One sentence they'd say out loud.">
        <Textarea
          id="p-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Give me one tool that does people ops end-to-end."
          rows={2}
          maxLength={280}
        />
      </FieldRow>

      {/* Lists */}
      <ListField label="Goals" items={goals} onChange={setGoals} placeholder="Consolidate HR tools" />
      <ListField
        label="Pain points"
        items={painPoints}
        onChange={setPainPoints}
        placeholder="Past all-in-one platforms underdelivered"
      />

      {/* Behaviour & voice */}
      <FieldRow
        label="Behaviour"
        htmlFor="p-behaviour"
        hint="How they work, tools they use, habits."
      >
        <Textarea
          id="p-behaviour"
          value={behaviour}
          onChange={(e) => setBehaviour(e.target.value)}
          rows={3}
          maxLength={600}
        />
      </FieldRow>
      <FieldRow label="Voice" htmlFor="p-voice" hint="Tone and phrases they use.">
        <Textarea
          id="p-voice"
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          rows={2}
          maxLength={400}
        />
      </FieldRow>

      {/* Gaps */}
      {gaps.length > 0 && (
        <section className="rounded-2xl border border-secondary/40 bg-secondary/10 p-5">
          <p className="mb-3 text-sm font-medium text-foreground">
            Worth answering — these would sharpen the persona:
          </p>
          <ul className="space-y-2">
            {gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                <span className="flex-1">{gap}</span>
                <button
                  type="button"
                  onClick={() => setGaps(gaps.filter((_, idx) => idx !== i))}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss gap"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------------- Small helpers ---------------- */

function FieldRow({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <Label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ListField({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const update = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Nothing here yet.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            <Input
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder={placeholder}
              maxLength={200}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(i)}
              className="text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${label.toLowerCase()}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add {label.toLowerCase().replace(/s$/, "")}
      </Button>
    </div>
  );
}

export default PersonaEditor;
