/* In-browser "database" behind the mock API. Persisted to localStorage so data stays in sync
   across pages, refreshes and tabs (a `storage` listener reloads changes made in another tab).
   Each tab keeps its own signed-in session (sessionStorage), so two accounts can talk to each
   other in two tabs — the closest a browser-only mock can get to two real devices. */
import type { User } from "@/features/auth/api/auth-schemas";
import type {
  TourDetail,
  TourSummary,
} from "@/features/tours/api/tour-schemas";
import {
  createSeed,
  DB_VERSION,
  type Db,
  type DbTour,
  type DbUser,
  type NotificationType,
} from "./seed";

const STORAGE_KEY = "hamsafar.mock-db";
const SESSION_KEY = "hamsafar.mock-session";
const SIGNED_OUT = "signed-out";
let memory: Db | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) memory = null;
  });
}

function load(): Db {
  if (memory) return memory;
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Db;
      if (parsed.version === DB_VERSION) {
        memory = parsed;
        return parsed;
      }
    }
  } catch {
    /* corrupted or unavailable storage — start fresh */
  }
  memory = createSeed();
  return memory;
}

export function db(): Db {
  return load();
}

export function persist(): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(load()));
  } catch {
    /* storage full / blocked: keep working in memory */
  }
}

export function resetDb(): void {
  memory = createSeed();
  setSessionId(null);
  persist();
}

let seq = Date.now() % 100000;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq.toString(36)}${Math.floor(Math.random() * 36).toString(36)}`;
}

/* ---------- simulated cookie session (per tab) ---------- */
let memorySession: string | null = null;
export function getSessionId(): string | null {
  try {
    const own = globalThis.sessionStorage?.getItem(SESSION_KEY);
    if (own === SIGNED_OUT) return null; // this tab signed out explicitly: don't re-inherit
    if (own) return own;
    const last = globalThis.localStorage?.getItem(`${SESSION_KEY}.last`);
    if (last && globalThis.sessionStorage) {
      // A new tab inherits the last sign-in (like a shared cookie) but gets its own session copy,
      // so signing out or switching account here never signs the other tab out.
      const src = db().sessions.find((x) => x.id === last);
      if (!src) return memorySession;
      const copy = {
        ...src,
        id: newId("sess"),
        device: src.device.includes("زبانه")
          ? src.device
          : `${src.device} · زبانه دیگر`,
        lastActiveAt: new Date().toISOString(),
      };
      db().sessions.push(copy);
      persist();
      globalThis.sessionStorage.setItem(SESSION_KEY, copy.id);
      return copy.id;
    }
    return last ?? memorySession;
  } catch {
    return memorySession;
  }
}
export function setSessionId(id: string | null): void {
  memorySession = id;
  try {
    if (id) {
      globalThis.sessionStorage?.setItem(SESSION_KEY, id);
      globalThis.localStorage?.setItem(`${SESSION_KEY}.last`, id);
    } else {
      const mine = globalThis.sessionStorage?.getItem(SESSION_KEY);
      globalThis.sessionStorage?.setItem(SESSION_KEY, SIGNED_OUT);
      if (
        !mine ||
        globalThis.localStorage?.getItem(`${SESSION_KEY}.last`) === mine
      )
        globalThis.localStorage?.removeItem(`${SESSION_KEY}.last`);
    }
  } catch {
    /* ignore */
  }
}

/* ---------- uploaded media (IndexedDB + in-memory cache; data URLs) ---------- */
const media = new Map<string, string>();
const IDB_NAME = "hamsafar-mock-media";

function openIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

let mediaLoaded: Promise<void> | null = null;
/** Loads previously uploaded files into memory (call before serving responses). */
export function ensureMedia(): Promise<void> {
  if (!mediaLoaded) {
    mediaLoaded = openIdb().then(
      (idb) =>
        new Promise<void>((resolve) => {
          if (!idb) return resolve();
          const tx = idb.transaction("files", "readonly");
          const req = tx.objectStore("files").openCursor();
          req.onsuccess = () => {
            const cursor = req.result;
            if (cursor) {
              media.set(String(cursor.key), String(cursor.value));
              cursor.continue();
            } else resolve();
          };
          req.onerror = () => resolve();
        }),
    );
  }
  return mediaLoaded;
}

export async function saveMedia(dataUrl: string): Promise<string> {
  const id = newId("media");
  media.set(id, dataUrl);
  const idb = await openIdb();
  if (idb) {
    await new Promise<void>((resolve) => {
      const tx = idb.transaction("files", "readwrite");
      tx.objectStore("files").put(dataUrl, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  return `media:${id}`;
}

/** Resolves stored references ("media:<id>" or public paths) to URLs the browser can show. */
export function resolveUrl(ref: string | null): string | null {
  if (!ref) return null;
  if (ref.startsWith("media:")) return media.get(ref.slice(6)) ?? null;
  return ref;
}

/* ---------- lookups ---------- */
export function currentUser(): DbUser | null {
  const d = load();
  const sid = getSessionId(); // read once: a new tab may create its session copy here
  const session = d.sessions.find((s) => s.id === sid);
  if (!session) return null;
  const user = d.users.find((u) => u.id === session.userId) ?? null;
  return user && !user.blocked ? user : null;
}

export function findUser(id: string): DbUser | undefined {
  return load().users.find((u) => u.id === id);
}

export function userName(id: string): string {
  const u = findUser(id);
  if (!u) return "کاربر همسفر";
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || "همسفر جدید";
}

export function userRating(id: string): {
  rating: number | null;
  count: number;
} {
  const list = load().reviews.filter((r) => r.targetUserId === id);
  if (list.length === 0)
    return { rating: findUser(id)?.rating ?? null, count: 0 };
  return {
    rating:
      Math.round((list.reduce((s, r) => s + r.rating, 0) / list.length) * 10) /
      10,
    count: list.length,
  };
}

export function tripsCount(id: string): number {
  const d = load();
  return (
    d.requests.filter((r) => r.userId === id && r.status === "approved")
      .length +
    d.tours.filter((t) => t.creatorId === id && t.status !== "draft").length
  );
}

export function toUserDto(u: DbUser): User {
  return {
    id: u.id,
    phone: u.phone,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    city: u.city,
    bio: u.bio,
    role: u.role,
    profileComplete: Boolean(u.firstName && u.lastName),
    createdAt: u.createdAt,
    avatarUrl: resolveUrl(u.avatarUrl),
    travelStyles: u.travelStyles,
    languages: u.languages,
    interests: u.interests,
    budgetRange: u.budgetRange,
    favoritesPublic: u.favoritesPublic,
    rating: userRating(u.id).rating,
    tripsCount: tripsCount(u.id),
  };
}

export function personDto(id: string) {
  const u = findUser(id);
  return {
    id,
    displayName: userName(id),
    avatarUrl: resolveUrl(u?.avatarUrl ?? null),
    city: u?.city ?? null,
  };
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function tourEndDate(t: DbTour): string {
  return addDays(t.startDate, t.durationDays - 1);
}

export function confirmedCount(t: DbTour): number {
  // A checkout can reserve several seats (the user plus companions without an account).
  return (
    t.baseConfirmed +
    load()
      .requests.filter((r) => r.tourId === t.id && r.status === "approved")
      .reduce((n, r) => n + (r.seats ?? 1), 0)
  );
}

/** Named participants: the leader plus approved members (seed-only anonymous members excluded). */
export function participants(t: DbTour): string[] {
  const approved = load()
    .requests.filter((r) => r.tourId === t.id && r.status === "approved")
    .map((r) => r.userId);
  return [t.creatorId, ...approved.filter((id) => id !== t.creatorId)];
}

export function isParticipant(t: DbTour, userId: string | undefined): boolean {
  return !!userId && participants(t).includes(userId);
}

export function notify(
  userIds: string[],
  type: NotificationType,
  title: string,
  body: string,
  tourId: string | null,
): void {
  const d = load();
  const now = new Date().toISOString();
  [...new Set(userIds)].forEach((userId) =>
    d.notifications.push({
      id: newId("n"),
      userId,
      type,
      title,
      body,
      tourId,
      createdAt: now,
      read: false,
    }),
  );
}

/** Keeps status consistent with membership: open → confirmed when the minimum is reached. */
export function syncStatus(t: DbTour): void {
  if (t.status === "open" && confirmedCount(t) >= t.minParticipants) {
    t.status = "confirmed";
    notify(
      participants(t),
      "quorum_reached",
      "تور قطعی شد",
      `تور «${t.title}» به حد نصاب رسید و قطعی شد.`,
      t.id,
    );
  }
}

export function toSummary(t: DbTour): TourSummary {
  return {
    id: t.id,
    title: t.title,
    destination: t.destination,
    province: t.province,
    coverImageUrl:
      resolveUrl(t.coverImageUrl) ?? "/images/tours/tour-hyrcanian-forest.webp",
    startDate: t.startDate,
    endDate: tourEndDate(t),
    durationDays: t.durationDays,
    priceToman: t.priceToman,
    capacity: t.capacity,
    minParticipants: t.minParticipants,
    confirmedCount: confirmedCount(t),
    difficulty: t.difficulty,
    categories: t.categories,
    badge: t.badge,
    rating: t.rating,
    reviewCount: t.reviewCount,
    status: t.status,
    createdAt: t.createdAt,
  };
}

export function toDetail(t: DbTour, viewer: DbUser | null): TourDetail {
  const d = load();
  const summary = toSummary(t);
  const membership = viewer
    ? [...d.requests]
        .reverse()
        .find(
          (r) =>
            r.tourId === t.id &&
            r.userId === viewer.id &&
            r.status !== "cancelled",
        )
    : undefined;
  const isCreator = viewer?.id === t.creatorId;
  const isMember = isCreator || membership?.status === "approved";
  const bookable =
    (t.status === "open" || t.status === "confirmed") &&
    summary.confirmedCount < t.capacity;
  const creator = findUser(t.creatorId);
  return {
    ...summary,
    description: t.description,
    highlights: t.highlights,
    includes: t.includes,
    meetingPoint: t.meetingPoint,
    requiresApproval: t.requiresApproval,
    gallery: t.gallery.map((g) => resolveUrl(g) ?? g),
    cancelReason: t.cancelReason ?? null,
    itinerary: t.itinerary.map((day) => ({
      ...day,
      date: addDays(t.startDate, day.dayNumber - 1),
      items: day.items.map((it) => ({
        ...it,
        comments: d.comments
          .filter((c) => c.itemId === it.id)
          .map((c) => ({
            id: c.id,
            text: c.text,
            createdAt: c.createdAt,
            author: personDto(c.userId),
            byLeader: c.userId === t.creatorId,
          })),
      })),
    })),
    changeLog: d.changes
      .filter((c) => c.tourId === t.id)
      .map((c) => ({ id: c.id, at: c.at, text: c.text }))
      .reverse(),
    members: participants(t).map((id) => {
      const u = findUser(id);
      return {
        ...personDto(id),
        isLeader: id === t.creatorId,
        tagline: u?.interests[0] ?? null,
      };
    }),
    anonymousMembers: t.baseConfirmed,
    creator: {
      id: t.creatorId,
      displayName: userName(t.creatorId),
      avatarUrl: resolveUrl(creator?.avatarUrl ?? null),
      rating: userRating(t.creatorId).rating,
      toursLed: d.tours.filter(
        (x) => x.creatorId === t.creatorId && x.status !== "draft",
      ).length,
      bio: creator?.bio ?? null,
      memberSince: creator?.createdAt ?? null,
      reviewCount: userRating(t.creatorId).count,
      verifications: creator?.bio
        ? [
            "کارت راهنمای تور میراث فرهنگی",
            "گواهی کمک‌های اولیه هلال‌احمر",
            "بیمه مسئولیت مدنی سفر",
            "احراز هویت تصویری و بانکی",
          ]
        : ["احراز هویت شماره موبایل"],
    },
    leaderReviews: d.reviews
      .filter((r) => r.targetUserId === t.creatorId)
      .slice(-3)
      .reverse()
      .map((r) => ({
        id: r.id,
        authorName: userName(r.authorId),
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        tourTitle: d.tours.find((x) => x.id === r.tourId)?.title ?? "",
      })),
    viewer: {
      isFavorite: viewer
        ? d.favorites.some((f) => f.userId === viewer.id && f.tourId === t.id)
        : false,
      isCreator,
      isMember,
      membership: membership
        ? { requestId: membership.id, status: membership.status }
        : null,
      canRequestJoin:
        !!viewer &&
        !isCreator &&
        bookable &&
        (!membership || membership.status === "rejected"),
      canChat:
        isMember && (t.status === "confirmed" || t.status === "completed"),
      canManage:
        isCreator && !["cancelled", "completed", "rejected"].includes(t.status),
      canReview: isMember && t.status === "completed",
    },
  };
}

export function isPublic(t: DbTour): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return (
    (t.status === "open" || t.status === "confirmed") && t.startDate >= today
  );
}
