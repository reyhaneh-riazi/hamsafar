import type { ReactNode } from "react";
import {
  Ban,
  CheckCheck,
  CircleCheck,
  Clock3,
  LinkIcon,
  Unlink,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { InviteStatus } from "../api/invite-schemas";
import { INVITE_STATUS_META } from "../model/invite-status";
import { Badge } from "@/shared/ui/Badge";

/** `invalid` = token unknown to the server (404); the others come from the API. */
export type LinkState = InviteStatus | "invalid";

const VISUALS: Record<
  LinkState,
  { icon: typeof LinkIcon; ring: string; iconTone: string }
> = {
  valid: {
    icon: CircleCheck,
    ring: "border-forest-200 dark:border-forest-800",
    iconTone: "bg-tint-mint text-forest-700 dark:text-forest-200",
  },
  expired: {
    icon: Clock3,
    ring: "border-warning/40",
    iconTone: "bg-warning/15 text-warning",
  },
  used: {
    icon: CheckCheck,
    ring: "border-line",
    iconTone: "bg-surface-muted text-ink-muted",
  },
  revoked: {
    icon: Ban,
    ring: "border-danger/30",
    iconTone: "bg-danger/10 text-danger",
  },
  invalid: {
    icon: Unlink,
    ring: "border-danger/30",
    iconTone: "bg-danger/10 text-danger",
  },
};

interface LinkStatusCardProps {
  state: LinkState;
  title: string;
  text: ReactNode;
  /** Extra content: tour preview, actions... */
  children?: ReactNode;
  className?: string;
}

/** Card that explains the state of an invite link with one consistent layout for every state. */
export function LinkStatusCard({
  state,
  title,
  text,
  children,
  className,
}: LinkStatusCardProps) {
  const v = VISUALS[state];
  const Icon = v.icon;
  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-panel border-2 bg-surface p-6 shadow-card sm:p-8",
        v.ring,
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl",
            v.iconTone,
          )}
        >
          <Icon className="size-8" aria-hidden="true" />
        </span>
        <Badge
          tone={state === "invalid" ? "danger" : INVITE_STATUS_META[state].tone}
          className="mt-4"
        >
          {state === "invalid" ? "نامعتبر" : INVITE_STATUS_META[state].label}
        </Badge>
        <h1 className="mt-3 text-xl font-black text-ink sm:text-2xl">
          {title}
        </h1>
        <div className="mt-2 max-w-md text-sm leading-7 text-ink-muted">
          {text}
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
