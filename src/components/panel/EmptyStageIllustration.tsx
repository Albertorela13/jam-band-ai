/**
 * Hand-coded SVG: three "seat" outlines arranged like a research panel,
 * with a smiling speech-bubble glyph in the center seat.
 * Cream + amber + coral, no external assets.
 */
export function EmptyStageIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="An empty panel with three open seats"
      className={className}
    >
      {/* Stage floor */}
      <ellipse
        cx="160"
        cy="170"
        rx="140"
        ry="14"
        fill="hsl(var(--subtle))"
      />

      {/* Left seat */}
      <g>
        <circle
          cx="60"
          cy="120"
          r="34"
          stroke="hsl(var(--border))"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          fill="hsl(var(--background))"
        />
        <circle cx="60" cy="115" r="9" fill="hsl(var(--border))" opacity="0.5" />
        <path
          d="M44 132 Q60 122 76 132"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      {/* Right seat */}
      <g>
        <circle
          cx="260"
          cy="120"
          r="34"
          stroke="hsl(var(--border))"
          strokeWidth="2.5"
          strokeDasharray="5 5"
          fill="hsl(var(--background))"
        />
        <circle cx="260" cy="115" r="9" fill="hsl(var(--border))" opacity="0.5" />
        <path
          d="M244 132 Q260 122 276 132"
          stroke="hsl(var(--border))"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      {/* Center seat (slightly back) with the jar */}
      <g>
        <circle
          cx="160"
          cy="90"
          r="42"
          stroke="hsl(var(--secondary))"
          strokeWidth="2.5"
          fill="hsl(var(--card))"
        />

        {/* Jam jar */}
        <g transform="translate(140 60)">
          {/* Lid */}
          <rect
            x="2"
            y="0"
            width="36"
            height="8"
            rx="2"
            fill="hsl(var(--secondary))"
          />
          {/* Jar body */}
          <path
            d="M4 10 H36 V44 Q36 50 30 50 H10 Q4 50 4 44 Z"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            strokeOpacity="0.15"
          />
          {/* Label */}
          <rect
            x="9"
            y="22"
            width="22"
            height="14"
            rx="2"
            fill="hsl(var(--background))"
            opacity="0.85"
          />
          {/* Music note inside label */}
          <g transform="translate(15 25)" fill="hsl(var(--foreground))">
            <circle cx="2" cy="8" r="2" />
            <rect x="3.2" y="0" width="1.4" height="9" />
            <path d="M3.2 0 Q9 1.2 9 5 L9 1 Q5 0.5 3.2 1.5 Z" />
          </g>
        </g>
      </g>
    </svg>
  );
}
