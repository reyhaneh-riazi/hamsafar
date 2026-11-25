import type { BadgeTone } from "@/shared/ui/Badge";
import type { InviteStatus } from "../api/invite-schemas";

export const INVITE_STATUS_META: Record<
  InviteStatus,
  { label: string; tone: BadgeTone }
> = {
  valid: { label: "معتبر", tone: "brand" },
  expired: { label: "منقضی‌شده", tone: "amber" },
  used: { label: "استفاده‌شده", tone: "neutral" },
  revoked: { label: "غیرفعال‌شده", tone: "danger" },
};

export function inviteUrl(
  token: string,
  origin: string = window.location.origin,
): string {
  return `${origin}/invite/${encodeURIComponent(token)}`;
}
