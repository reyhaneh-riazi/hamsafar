import { Crown } from "lucide-react";
import { Link } from "react-router";
import { toFaDigits } from "@/shared/lib/digits";
import { Avatar } from "@/shared/ui/Avatar";
import type { TourDetail } from "../api/tour-schemas";

/** Confirmed participants; each links to the public profile (ratings, report, block). */
export function MembersCard({ tour }: { tour: TourDetail }) {
  return (
    <section
      className="rounded-panel border border-line bg-surface p-6 sm:p-7"
      aria-labelledby="members-title"
    >
      <h2 id="members-title" className="text-lg font-black">
        همسفرها
      </h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {tour.members.map((m) => (
          <li key={m.id}>
            <Link
              to={`/users/${m.id}`}
              className="flex items-center gap-2 rounded-full border border-line bg-surface-muted py-1 pe-3 ps-1 transition hover:border-forest-400"
            >
              <Avatar name={m.displayName} src={m.avatarUrl} size="sm" />
              <span className="text-xs font-bold">{m.displayName}</span>
              {m.isLeader && (
                <Crown className="size-3.5 text-warning" aria-label="تورلیدر" />
              )}
            </Link>
          </li>
        ))}
        {tour.anonymousMembers > 0 && (
          <li className="flex items-center rounded-full border border-dashed border-line px-3 py-1.5 text-xs text-ink-muted">
            + {toFaDigits(tour.anonymousMembers)} همسفر دیگر
          </li>
        )}
      </ul>
    </section>
  );
}
