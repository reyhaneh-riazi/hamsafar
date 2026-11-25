/*
 * Demo photos used by the mock API.
 *
 * The API contract returns public paths such as `/images/tours/dest-lake.webp` (served from `public/`).
 * Here those paths are mapped to bundled imports, so Vite fingerprints them in normal builds and
 * inlines them in the single-file build (`--mode standalone`) — a lone index.html can't reach `public/`.
 * The stored data keeps the short paths, so the mock database in localStorage stays small.
 */
import damavand from "@/assets/tours/dest-damavand.webp";
import isfahan from "@/assets/tours/dest-isfahan.webp";
import lake from "@/assets/tours/dest-lake.webp";
import qeshm from "@/assets/tours/dest-qeshm.webp";
import hyrcan from "@/assets/tours/tour-hyrcanian-forest.webp";
import mesr from "@/assets/tours/tour-mesr-desert.webp";
import gulf from "@/assets/tours/tour-persian-gulf.webp";
import shirom from "@/assets/tours/tour-shirom-canyon.webp";

const DEMO_IMAGES: Record<string, string> = {
  "/images/tours/dest-damavand.webp": damavand,
  "/images/tours/dest-isfahan.webp": isfahan,
  "/images/tours/dest-lake.webp": lake,
  "/images/tours/dest-qeshm.webp": qeshm,
  "/images/tours/tour-hyrcanian-forest.webp": hyrcan,
  "/images/tours/tour-mesr-desert.webp": mesr,
  "/images/tours/tour-persian-gulf.webp": gulf,
  "/images/tours/tour-shirom-canyon.webp": shirom,
};

/** Maps a demo path to a URL the browser can load in every build; other values pass through. */
export function demoImageUrl(ref: string): string {
  return DEMO_IMAGES[ref] ?? ref;
}
