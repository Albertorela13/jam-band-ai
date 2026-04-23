interface PanelScoreRingProps {
  score: number; // 0-100
  size?: number;
}

export function PanelScoreRing({ score, size = 120 }: PanelScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  // Tone follows score
  const toneClass =
    clamped >= 70
      ? "text-success"
      : clamped >= 45
        ? "text-primary"
        : clamped >= 25
          ? "text-warning"
          : "text-destructive";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          fill="none"
          className={`${toneClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold leading-none">
          {clamped}
        </span>
        <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          Panel score
        </span>
      </div>
    </div>
  );
}
