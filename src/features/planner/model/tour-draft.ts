/* Create-tour wizard model: draft shape, reducer, validation, persistence and API mapping.
   Kept free of React so it can be unit-tested and reused by the mock API rules. */
import { z } from "zod";
import {
  categorySchema,
  difficultySchema,
  itemTypeSchema,
  type CreateTourBody,
  type Difficulty,
  type ItineraryItemType,
  type TourCategory,
  type TourDetail,
} from "@/features/tours/api/tour-schemas";
import { addDays, daysBetween, isIsoDate, todayIso } from "@/shared/lib/dates";
import { toFaDigits } from "@/shared/lib/digits";
import { formatNumber } from "@/shared/lib/format";

/* ---------------- limits (mirror docs/api-contract.md › POST /tours) ---------------- */
export const LIMITS = {
  titleMin: 5,
  titleMax: 80,
  destinationMin: 2,
  destinationMax: 60,
  provinceMin: 2,
  provinceMax: 40,
  descriptionMin: 20,
  descriptionMax: 2000,
  categoriesMax: 6,
  durationMin: 1,
  durationMax: 30,
  capacityMin: 2,
  capacityMax: 60,
  /** How far ahead a tour may start. */
  maxDaysAhead: 365,
  priceMin: 1,
  priceMax: 500_000_000,
  meetingPointMax: 120,
  dayTitleMax: 80,
  itemTitleMin: 2,
  itemTitleMax: 80,
  itemLocationMax: 80,
} as const;

/* ---------------- draft shape ---------------- */
export interface DraftItem {
  key: string;
  type: ItineraryItemType;
  title: string;
  startTime: string;
  location: string;
}

export interface DraftDay {
  title: string;
  items: DraftItem[];
}

export interface TourDraft {
  title: string;
  destination: string;
  province: string;
  categories: TourCategory[];
  /** Empty until the creator picks one. */
  difficulty: Difficulty | "";
  description: string;
  startDate: string;
  durationDays: number | null;
  capacity: number | null;
  minParticipants: number | null;
  priceToman: number | null;
  requiresApproval: boolean;
  meetingPoint: string;
  days: Record<number, DraftDay>;
}

export const EMPTY_DRAFT: TourDraft = {
  title: "",
  destination: "",
  province: "",
  categories: [],
  difficulty: "",
  description: "",
  startDate: "",
  durationDays: 3,
  capacity: 10,
  minParticipants: 5,
  priceToman: null,
  requiresApproval: true,
  meetingPoint: "",
  days: {},
};

let keySeq = 0;
export const newItemKey = () => `k${Date.now().toString(36)}${(keySeq += 1)}`;

export function dayOf(d: TourDraft, day: number): DraftDay {
  return d.days[day] ?? { title: "", items: [] };
}

/** Date of a given day (1-based) or null while the start date is unknown/invalid. */
export function dateOfDay(
  d: Pick<TourDraft, "startDate">,
  dayNumber: number,
): string | null {
  return isIsoDate(d.startDate) ? addDays(d.startDate, dayNumber - 1) : null;
}

export function endDateOf(
  d: Pick<TourDraft, "startDate" | "durationDays">,
): string | null {
  return isIsoDate(d.startDate) && d.durationDays
    ? addDays(d.startDate, d.durationDays - 1)
    : null;
}

export function isPristine(d: TourDraft): boolean {
  return JSON.stringify(d) === JSON.stringify(EMPTY_DRAFT);
}

/* ---------------- reducer ---------------- */
export type DraftAction =
  | { type: "set"; patch: Partial<TourDraft> }
  | { type: "replace"; draft: TourDraft }
  | { type: "dayTitle"; day: number; title: string }
  | { type: "addItem"; day: number }
  | { type: "updateItem"; day: number; key: string; patch: Partial<DraftItem> }
  | { type: "removeItem"; day: number; key: string }
  | { type: "moveItem"; day: number; key: string; dir: -1 | 1 };

function withDay(state: TourDraft, day: number, next: DraftDay): TourDraft {
  return { ...state, days: { ...state.days, [day]: next } };
}

export function draftReducer(state: TourDraft, a: DraftAction): TourDraft {
  switch (a.type) {
    case "set":
      return { ...state, ...a.patch };
    case "replace":
      return a.draft;
    case "dayTitle":
      return withDay(state, a.day, { ...dayOf(state, a.day), title: a.title });
    case "addItem": {
      const d = dayOf(state, a.day);
      const item: DraftItem = {
        key: newItemKey(),
        type: "activity",
        title: "",
        startTime: "",
        location: "",
      };
      return withDay(state, a.day, { ...d, items: [...d.items, item] });
    }
    case "updateItem": {
      const d = dayOf(state, a.day);
      return withDay(state, a.day, {
        ...d,
        items: d.items.map((i) => (i.key === a.key ? { ...i, ...a.patch } : i)),
      });
    }
    case "removeItem": {
      const d = dayOf(state, a.day);
      return withDay(state, a.day, {
        ...d,
        items: d.items.filter((i) => i.key !== a.key),
      });
    }
    case "moveItem": {
      const d = dayOf(state, a.day);
      const idx = d.items.findIndex((i) => i.key === a.key);
      const to = idx + a.dir;
      if (idx < 0 || to < 0 || to >= d.items.length) return state;
      const items = d.items.slice();
      const [moved] = items.splice(idx, 1);
      if (moved) items.splice(to, 0, moved);
      return withDay(state, a.day, { ...d, items });
    }
  }
}

/* ---------------- validation ---------------- */
export type DraftErrors = Record<string, string>;
export const STEP_COUNT = 4;

const n = (v: number) => toFaDigits(v);
/** Persian/Latin letters must appear — rejects inputs like "123" or "---". */
const HAS_LETTER = /[\p{L}]/u;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function text(
  e: DraftErrors,
  key: string,
  value: string,
  min: number,
  max: number,
  label: string,
) {
  const v = value.trim();
  if (v.length === 0) e[key] = `${label} را وارد کنید.`;
  else if (v.length < min) e[key] = `${label} باید حداقل ${n(min)} حرف باشد.`;
  else if (v.length > max) e[key] = `${label} حداکثر ${n(max)} حرف است.`;
  else if (!HAS_LETTER.test(v)) e[key] = `${label} باید شامل حروف باشد.`;
}

function intInRange(
  e: DraftErrors,
  key: string,
  value: number | null,
  min: number,
  max: number,
  label: string,
  unit: string,
) {
  if (value === null || Number.isNaN(value)) e[key] = `${label} را وارد کنید.`;
  else if (!Number.isInteger(value) || value < min || value > max)
    e[key] = `${label} باید بین ${n(min)} تا ${n(max)} ${unit} باشد.`;
}

function validateBasics(d: TourDraft, e: DraftErrors) {
  text(e, "title", d.title, LIMITS.titleMin, LIMITS.titleMax, "نام تور");
  text(
    e,
    "destination",
    d.destination,
    LIMITS.destinationMin,
    LIMITS.destinationMax,
    "مقصد",
  );
  text(
    e,
    "province",
    d.province,
    LIMITS.provinceMin,
    LIMITS.provinceMax,
    "استان",
  );
  if (d.categories.length === 0) e.categories = "حداقل یک سبک سفر انتخاب کنید.";
  else if (d.categories.length > LIMITS.categoriesMax)
    e.categories = `حداکثر ${n(LIMITS.categoriesMax)} سبک قابل انتخاب است.`;
  if (!difficultySchema.safeParse(d.difficulty).success)
    e.difficulty = "سطح سختی سفر را انتخاب کنید.";
  text(
    e,
    "description",
    d.description,
    LIMITS.descriptionMin,
    LIMITS.descriptionMax,
    "شرح سفر",
  );
}

function validateSchedule(d: TourDraft, e: DraftErrors, today: string) {
  if (!d.startDate) e.startDate = "تاریخ شروع سفر را انتخاب کنید.";
  else if (!isIsoDate(d.startDate)) e.startDate = "تاریخ شروع معتبر نیست.";
  else if (d.startDate <= today)
    e.startDate = "تاریخ شروع باید بعد از امروز باشد.";
  else if (daysBetween(today, d.startDate) > LIMITS.maxDaysAhead)
    e.startDate = "تاریخ شروع حداکثر تا یک سال آینده قابل انتخاب است.";

  intInRange(
    e,
    "durationDays",
    d.durationDays,
    LIMITS.durationMin,
    LIMITS.durationMax,
    "مدت سفر",
    "روز",
  );
  intInRange(
    e,
    "capacity",
    d.capacity,
    LIMITS.capacityMin,
    LIMITS.capacityMax,
    "ظرفیت",
    "نفر",
  );

  if (d.minParticipants === null) e.minParticipants = "حد نصاب را وارد کنید.";
  else if (!Number.isInteger(d.minParticipants) || d.minParticipants < 1)
    e.minParticipants = "حد نصاب باید حداقل ۱ نفر باشد.";
  else if (d.capacity !== null && d.minParticipants > d.capacity) {
    e.minParticipants = `حد نصاب نمی‌تواند از ظرفیت (${n(d.capacity)} نفر) بیشتر باشد.`;
  }

  if (d.priceToman === null) e.priceToman = "بودجه هر نفر را وارد کنید.";
  else if (d.priceToman < LIMITS.priceMin)
    e.priceToman = "بودجه هر نفر باید بیشتر از صفر باشد.";
  else if (d.priceToman > LIMITS.priceMax)
    e.priceToman = `بودجه هر نفر حداکثر ${formatNumber(LIMITS.priceMax)} تومان است.`;

  if (d.meetingPoint.trim().length > LIMITS.meetingPointMax)
    e.meetingPoint = `محل حرکت حداکثر ${n(LIMITS.meetingPointMax)} حرف است.`;
}

/** Error key of an itinerary item field, e.g. `item-k12-title`. */
export const itemErrorKey = (
  key: string,
  field: "title" | "startTime" | "location",
) => `item-${key}-${field}`;
export const dayErrorKey = (day: number) => `day-${day}-title`;

function validatePlan(d: TourDraft, e: DraftErrors) {
  const total = d.durationDays ?? 0;
  for (let day = 1; day <= total; day += 1) {
    const plan = dayOf(d, day);
    if (plan.title.trim().length > LIMITS.dayTitleMax)
      e[dayErrorKey(day)] =
        `عنوان روز حداکثر ${n(LIMITS.dayTitleMax)} حرف است.`;
    for (const it of plan.items) {
      const t = it.title.trim();
      if (t.length < LIMITS.itemTitleMin)
        e[itemErrorKey(it.key, "title")] = "عنوان این فعالیت را بنویسید.";
      else if (t.length > LIMITS.itemTitleMax)
        e[itemErrorKey(it.key, "title")] =
          `عنوان حداکثر ${n(LIMITS.itemTitleMax)} حرف است.`;
      if (it.startTime && !TIME.test(it.startTime))
        e[itemErrorKey(it.key, "startTime")] = "ساعت معتبر نیست.";
      if (it.location.trim().length > LIMITS.itemLocationMax)
        e[itemErrorKey(it.key, "location")] =
          `مکان حداکثر ${n(LIMITS.itemLocationMax)} حرف است.`;
    }
  }
}

export function validateStep(
  step: number,
  d: TourDraft,
  today: string = todayIso(),
): DraftErrors {
  const e: DraftErrors = {};
  if (step === 0) validateBasics(d, e);
  if (step === 1) validateSchedule(d, e, today);
  if (step === 2) validatePlan(d, e);
  return e;
}

/** First step (0..2) with errors, or -1 when the whole draft is valid. */
export function firstInvalidStep(
  d: TourDraft,
  today: string = todayIso(),
): { step: number; errors: DraftErrors } {
  for (const step of [0, 1, 2]) {
    const errors = validateStep(step, d, today);
    if (Object.keys(errors).length > 0) return { step, errors };
  }
  return { step: -1, errors: {} };
}

/** Days (1-based) that contain at least one validation error. */
export function invalidDays(d: TourDraft, errors: DraftErrors): Set<number> {
  const out = new Set<number>();
  const total = d.durationDays ?? 0;
  for (let day = 1; day <= total; day += 1) {
    const plan = dayOf(d, day);
    if (
      errors[dayErrorKey(day)] ||
      plan.items.some((it) =>
        Object.keys(errors).some((k) => k.startsWith(`item-${it.key}-`)),
      )
    )
      out.add(day);
  }
  return out;
}

/** Maps server field paths (e.g. `itinerary.0.items.1.title`) back to form keys where possible. */
export function mapServerFieldErrors(
  fields: Record<string, string>,
): DraftErrors {
  const e: DraftErrors = {};
  for (const [path, message] of Object.entries(fields)) {
    const root = path.split(".")[0] ?? path;
    e[root] = message;
  }
  return e;
}

/* ---------------- API mapping ---------------- */
/** Builds the POST/PUT /tours body. Call only after {@link firstInvalidStep} returns -1. */
export function toCreateBody(d: TourDraft, submit: boolean): CreateTourBody {
  const duration = d.durationDays ?? 1;
  return {
    title: d.title.trim(),
    destination: d.destination.trim(),
    province: d.province.trim(),
    startDate: d.startDate,
    durationDays: duration,
    priceToman: d.priceToman ?? 0,
    capacity: d.capacity ?? LIMITS.capacityMin,
    minParticipants: d.minParticipants ?? 1,
    difficulty: d.difficulty === "" ? "easy" : d.difficulty,
    categories: d.categories,
    description: d.description.trim(),
    meetingPoint: d.meetingPoint.trim() || null,
    requiresApproval: d.requiresApproval,
    submit,
    itinerary: Array.from({ length: duration }, (_, i) => {
      const day = dayOf(d, i + 1);
      return {
        dayNumber: i + 1,
        title: day.title.trim(),
        items: day.items.map((it) => ({
          type: it.type,
          title: it.title.trim(),
          location: it.location.trim() || null,
          startTime: it.startTime || null,
          note: null,
        })),
      };
    }),
  };
}

/** Re-opens a server draft (GET /tours/:id) in the wizard. */
export function fromTourDetail(t: TourDetail): TourDraft {
  const days: Record<number, DraftDay> = {};
  for (const day of t.itinerary) {
    days[day.dayNumber] = {
      // The mock fills empty titles with "روز N"; don't show that placeholder back as user input.
      title: day.title === `روز ${day.dayNumber}` ? "" : day.title,
      items: day.items.map((it) => ({
        key: newItemKey(),
        type: it.type,
        title: it.title,
        startTime: it.startTime ?? "",
        location: it.location ?? "",
      })),
    };
  }
  return {
    title: t.title,
    destination: t.destination,
    province: t.province,
    categories: t.categories,
    difficulty: t.difficulty,
    description: t.description,
    startDate: t.startDate,
    durationDays: t.durationDays,
    capacity: t.capacity,
    minParticipants: t.minParticipants,
    priceToman: t.priceToman,
    requiresApproval: t.requiresApproval,
    meetingPoint: t.meetingPoint ?? "",
    days,
  };
}

/* ---------------- local autosave (untrusted storage → validated) ---------------- */
const nullableInt = z.number().int().nullable();
const storedDraftSchema = z.object({
  version: z.literal(1),
  savedAt: z.string(),
  step: z
    .number()
    .int()
    .min(0)
    .max(STEP_COUNT - 1),
  /** ID of the server draft this local copy belongs to (null = not yet saved to the server). */
  serverId: z.string().nullable(),
  draft: z.object({
    title: z.string().max(500),
    destination: z.string().max(500),
    province: z.string().max(500),
    categories: z.array(categorySchema).max(10),
    difficulty: z.union([difficultySchema, z.literal("")]),
    description: z.string().max(5000),
    startDate: z.string().max(20),
    durationDays: nullableInt,
    capacity: nullableInt,
    minParticipants: nullableInt,
    priceToman: nullableInt,
    requiresApproval: z.boolean(),
    meetingPoint: z.string().max(500),
    days: z.record(
      z.string(),
      z.object({
        title: z.string().max(500),
        items: z.array(
          z.object({
            key: z.string(),
            type: itemTypeSchema,
            title: z.string().max(500),
            startTime: z.string().max(10),
            location: z.string().max(500),
          }),
        ),
      }),
    ),
  }),
});
export type StoredDraft = Omit<z.infer<typeof storedDraftSchema>, "draft"> & {
  draft: TourDraft;
};

export function draftStorageKey(userId: string) {
  return `hamsafar:planner-draft:v1:${userId}`;
}

export function serializeDraft(
  draft: TourDraft,
  step: number,
  serverId: string | null,
  now = new Date(),
): string {
  const stored: StoredDraft = {
    version: 1,
    savedAt: now.toISOString(),
    step,
    serverId,
    draft,
  };
  return JSON.stringify(stored);
}

export function parseStoredDraft(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const parsed = storedDraftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const { draft, ...meta } = parsed.data;
    const days: Record<number, DraftDay> = {};
    for (const [k, v] of Object.entries(draft.days)) {
      const day = Number(k);
      if (Number.isInteger(day) && day > 0) days[day] = v;
    }
    return { ...meta, draft: { ...draft, days } };
  } catch {
    return null;
  }
}
