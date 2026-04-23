import type { Reaction } from "@/lib/storage";
import { Heart, ThumbsUp, Scale, X } from "lucide-react";

const META: Record<
  Reaction,
  { label: string; bg: string; text: string; Icon: typeof Heart }
> = {
  loves: {
    label: "Loves it",
    bg: "bg-success/15",
    text: "text-success",
    Icon: Heart,
  },
  likes: {
    label: "Likes it",
    bg: "bg-primary/20",
    text: "text-foreground",
    Icon: ThumbsUp,
  },
  mixed: {
    label: "Mixed",
    bg: "bg-warning/20",
    text: "text-foreground",
    Icon: Scale,
  },
  rejects: {
    label: "Rejects",
    bg: "bg-destructive/15",
    text: "text-destructive",
    Icon: X,
  },
};

interface ReactionBadgeProps {
  reaction: Reaction;
  size?: "sm" | "md";
}

export function ReactionBadge({ reaction, size = "md" }: ReactionBadgeProps) {
  const { label, bg, text, Icon } = META[reaction];
  const sizing =
    size === "sm" ? "px-2.5 py-0.5 text-xs gap-1" : "px-3 py-1 text-sm gap-1.5";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${bg} ${text} ${sizing}`}
    >
      <Icon className={iconSize} strokeWidth={2.5} />
      {label}
    </span>
  );
}
