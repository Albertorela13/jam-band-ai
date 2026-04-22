import { useNavigate } from "react-router-dom";
import type { Persona } from "@/lib/storage";
import { getAvatarUrl } from "@/lib/avatar";

interface PersonaCardProps {
  persona: Persona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  const navigate = useNavigate();
  const avatar = getAvatarUrl(persona.avatar_seed ?? persona.id);

  return (
    <button
      onClick={() => navigate(`/persona/${persona.id}`)}
      className="group flex min-h-[280px] flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 text-left shadow-warm transition-all duration-200 ease-bounce hover:scale-[1.015] hover:shadow-warm-lg"
    >
      <div className="flex w-full items-start gap-4">
        <img
          src={avatar}
          alt={`Avatar for ${persona.name}`}
          className="h-20 w-20 shrink-0 rounded-full bg-subtle"
          loading="lazy"
        />
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="font-display text-xl font-semibold leading-tight text-foreground">
            {persona.name}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{persona.role}</p>
        </div>
      </div>

      {persona.quote && (
        <blockquote className="mt-auto border-l-[3px] border-secondary pl-4 text-sm italic leading-relaxed text-foreground/85 line-clamp-4">
          &ldquo;{persona.quote}&rdquo;
        </blockquote>
      )}
    </button>
  );
}
