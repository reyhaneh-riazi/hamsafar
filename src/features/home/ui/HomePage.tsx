import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { HomeHero } from "./HomeHero";
import {
  FeaturedToursSection,
  PeopleSection,
  PopularDestinations,
  StepsBand,
} from "./HomeSections";

/** Home — Figma frame 28:5555 (light) / 26:4643 (dark). */
export function HomePage() {
  useDocumentTitle("");
  return (
    <div className="bg-[#f6f3ee] dark:bg-canvas">
      <HomeHero />
      <PopularDestinations />
      <FeaturedToursSection />
      <StepsBand />
      <PeopleSection />
    </div>
  );
}
