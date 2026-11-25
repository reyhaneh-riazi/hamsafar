import { cn } from "@/shared/lib/cn";
import clusterA from "@/assets/botanical/leaf-cluster-a.webp";
import clusterB from "@/assets/botanical/leaf-cluster-b.webp";
import cornerTop from "@/assets/botanical/leaf-corner-top.webp";
import ground from "@/assets/botanical/leaf-ground.webp";
import single from "@/assets/botanical/leaf-single.webp";
import sprigA from "@/assets/botanical/leaf-sprig-a.webp";
import sprigB from "@/assets/botanical/leaf-sprig-b.webp";
import tall from "@/assets/botanical/leaf-tall.webp";

/**
 * Rendered botanical artwork (see docs/assets.md — generated in-house, transparent WebP @2x).
 * Purely decorative: empty alt, aria-hidden, no pointer events.
 */
const ART = {
  "corner-top": { src: cornerTop, w: 647, h: 737, origin: "origin-top-left" },
  "cluster-a": { src: clusterA, w: 358, h: 699, origin: "origin-bottom-right" },
  "cluster-b": { src: clusterB, w: 341, h: 710, origin: "origin-bottom-right" },
  "sprig-a": { src: sprigA, w: 301, h: 334, origin: "origin-bottom-left" },
  "sprig-b": { src: sprigB, w: 373, h: 271, origin: "origin-bottom-left" },
  tall: { src: tall, w: 211, h: 900, origin: "origin-bottom" },
  ground: { src: ground, w: 581, h: 233, origin: "origin-bottom" },
  single: { src: single, w: 215, h: 211, origin: "origin-bottom-left" },
} as const;

export type FoliageVariant = keyof typeof ART;

const MOTION = {
  none: "",
  sway: "animate-sway",
  slow: "animate-sway-slow",
  reverse: "animate-sway-reverse",
} as const;

interface FoliageProps {
  variant: FoliageVariant;
  className?: string;
  /** Mirror horizontally (use for the opposite page edge). */
  flip?: boolean;
  flipY?: boolean;
  motion?: keyof typeof MOTION;
  eager?: boolean;
}

export function Foliage({
  variant,
  className,
  flip,
  flipY,
  motion = "slow",
  eager,
}: FoliageProps) {
  const art = ART[variant];
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none select-none",
        flip && "-scale-x-100",
        flipY && "-scale-y-100",
        className,
      )}
    >
      <img
        src={art.src}
        width={art.w}
        height={art.h}
        alt=""
        draggable={false}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={cn("block h-auto w-full", art.origin, MOTION[motion])}
      />
    </div>
  );
}
