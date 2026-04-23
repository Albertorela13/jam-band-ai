import { Sparkles, AlertTriangle, HelpCircle, Lightbulb } from "lucide-react";
import type { Persona, TestPersonaResult } from "@/lib/storage";
import { getAvatarUrl } from "@/lib/avatar";
import { ReactionBadge } from "./ReactionBadge";

interface PersonaResultCardProps {
  persona?: Persona;
  result: TestPersonaResult;
}

export function PersonaResultCard({ persona, result }: PersonaResultCardProps) {
  const name = persona?.name ?? "Unknown persona";
  const role = persona?.role ?? "No longer in your panel";
  const avatar = getAvatarUrl(persona?.avatar_seed ?? persona?.id ?? result.persona_id);

  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-warm">
      <header className="flex items-start gap-4">
        <img
          src={avatar}
          alt=""
          className="h-14 w-14 shrink-0 rounded-full bg-subtle"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">
            {name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{role}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ReactionBadge reaction={result.reaction} />
          <span className="text-xs text-muted-foreground">
            Score{" "}
            <span className="font-semibold text-foreground">{result.score}</span>
            /100
          </span>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <ResultList
          title="What lands"
          icon={<Sparkles className="h-4 w-4 text-success" />}
          items={result.what_lands}
          accent="border-success/40"
        />
        <ResultList
          title="What concerns"
          icon={<AlertTriangle className="h-4 w-4 text-warning" />}
          items={result.what_concerns}
          accent="border-warning/40"
        />
        <ResultList
          title="Questions for the PM"
          icon={<HelpCircle className="h-4 w-4 text-secondary" />}
          items={result.questions_for_pm}
          accent="border-secondary/40"
        />
        <div className="rounded-xl border border-primary/40 bg-primary/10 p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-primary" strokeWidth={2.5} />
            Suggestion
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">
            {result.suggestion || <span className="italic text-muted-foreground">No suggestion offered.</span>}
          </p>
        </div>
      </div>
    </article>
  );
}

function ResultList({
  title,
  icon,
  items,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  accent: string;
}) {
  return (
    <div className={`rounded-xl border ${accent} bg-background/60 p-4`}>
      <h4 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h4>
      {items.length === 0 ? (
        <p className="mt-2 text-sm italic text-muted-foreground">Nothing flagged.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground/85">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
