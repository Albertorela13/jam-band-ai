interface PlaceholderProps {
  title: string;
  note?: string;
}

export function Placeholder({ title, note }: PlaceholderProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground">{note ?? "Coming soon in the next stage."}</p>
    </div>
  );
}
