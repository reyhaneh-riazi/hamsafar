import { cn } from "@/shared/lib/cn";

/** Hand-drawn coral brush stroke under the hero headline (draws itself in). */
export function BrushUnderline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 26"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M6 17C60 9 140 5 212 7c40 1 70 3 102 8"
        pathLength={1}
        strokeDasharray="1"
        className="animate-draw"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Dashed flight path + paper plane next to the category row. */
export function PaperPlaneTrail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true">
      <path
        d="M6 86c10-14 2-26 16-30s22 10 34 2 6-26 22-30 20 2 30-8"
        stroke="currentColor"
        strokeOpacity="0.55"
        strokeWidth="1.4"
        strokeDasharray="3 4"
        fill="none"
        strokeLinecap="round"
      />
      <g className="animate-plane-fly origin-center">
        <path
          d="M84 16 116 4 104 34 96 25Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M96 25 116 4M96 25l-2 9 6-5"
          stroke="currentColor"
          strokeWidth="1.6"
          fill="none"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Curly dashed line used on the opposite side of the category row. */
export function CurlyTrail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 90" className={className} aria-hidden="true">
      <path
        d="M60 4c-6 18-30 14-28 30s22 10 18 24-26 10-30 28"
        stroke="currentColor"
        strokeOpacity="0.5"
        strokeWidth="1.4"
        strokeDasharray="3 4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="20" cy="86" r="2.4" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

/** Hand-drawn loop ending in a heart ("الهام بگیر"). */
export function HeartLoop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 40" className={className} aria-hidden="true">
      <path
        d="M4 12c6 16 22 24 40 22 14-1 26-8 32-18"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M80 20c-6-5-8-11-3-13 3-1 5 1 6 3 1-3 4-5 7-3 4 3 0 9-10 13Z"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Leaf-on-a-curl doodle for the planner card. */
export function LeafCurl({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 40" className={className} aria-hidden="true">
      <path
        d="M4 6c2 18 18 30 44 24"
        stroke="currentColor"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M46 30c4-14 16-22 30-20-2 14-14 22-30 20Z" fill="#6FA05A" />
      <path
        d="M48 29c8-6 15-11 25-17"
        stroke="#3F6B34"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

/** Small leaf glyph used before section titles (matches the reference's green leaf). */
export function LeafGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <path d="M5 24C7 13 14 6 25 3c-1 11-7 19-20 21Z" fill="#3B8158" />
      <path
        d="M5 24C10 17 15 12 22 6"
        stroke="#D9EBDD"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M11 17.5 9.5 13M14.5 14l-1-5M14 19l4-1.5M17.5 15.5l4-1"
        stroke="#D9EBDD"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Wavy top edge for the footer. */
export function WaveEdge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 46C160 76 330 18 540 30s380 50 590 24c150-18 230-34 310-26V80H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Mountain outline (footer decoration). */
export function MountainLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 40" className={className} aria-hidden="true">
      <path
        d="M2 38 34 8l16 16 14-12 22 22 14-12 26 16"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Small airplane with dotted trail (footer). */
export function PlaneTrail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 30" className={className} aria-hidden="true">
      <path
        d="M2 22c18 6 34-10 52-4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 3"
        fill="none"
      />
      <path d="M60 16l22-8-6 6 8 6-10-2-6 6 1-7Z" fill="currentColor" />
    </svg>
  );
}

/** Pine tree silhouettes (footer corner). */
export function PineTrees({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" className={className} aria-hidden="true">
      {[
        [22, 70, 0.9],
        [50, 70, 1.25],
        [82, 70, 0.8],
        [104, 70, 1.05],
      ].map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${s})`}>
          <path
            d="M0-50 11-28H5l10 14H7l11 14h-36l11-14h-8l10-14h-6Z"
            fill="currentColor"
          />
        </g>
      ))}
    </svg>
  );
}
