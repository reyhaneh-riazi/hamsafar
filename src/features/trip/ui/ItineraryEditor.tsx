import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import {
  itemStatusSchema,
  itemTypeSchema,
  type ItemStatus,
  type ItineraryItemType,
  type TourDetail,
} from "@/features/tours/api/tour-schemas";
import { ITEM_TYPE_LABELS } from "@/features/tours/model/labels";
import { errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toFaDigits, toLatinDigits } from "@/shared/lib/digits";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";
import { useUpdateItinerary } from "../hooks";
import { ITEM_STATUS_META } from "./PlanPanel";

interface EditItem {
  key: string;
  id: string | null;
  type: ItineraryItemType;
  title: string;
  startTime: string;
  location: string;
  note: string;
  cost: string;
  link: string;
  status: ItemStatus;
}
interface EditDay {
  title: string;
  items: EditItem[];
}
type Days = Record<number, EditDay>;
const entries = (days: Days) => Object.entries(days) as [string, EditDay][];

type ItemErrors = Partial<
  Record<"title" | "startTime" | "location" | "cost" | "link" | "note", string>
>;

/** Item form rules (same limits as PUT /tours/:id/itinerary in docs/api-contract.md). */
export function validateItem(
  it: Pick<
    EditItem,
    "title" | "startTime" | "location" | "cost" | "link" | "note"
  >,
): ItemErrors {
  const e: ItemErrors = {};
  const title = it.title.trim();
  if (title.length < 2) e.title = "عنوان را بنویسید (حداقل ۲ حرف).";
  else if (title.length > 80) e.title = "عنوان حداکثر ۸۰ حرف است.";
  if (it.startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(it.startTime))
    e.startTime = "ساعت معتبر نیست.";
  if (it.location.trim().length > 80) e.location = "مکان حداکثر ۸۰ حرف است.";
  if (it.cost.trim()) {
    const digits = toLatinDigits(it.cost).replace(/[,،٬\s]/g, "");
    if (!/^\d+$/.test(digits)) e.cost = "هزینه را فقط با عدد بنویسید.";
    else if (Number(digits) > 1_000_000_000)
      e.cost = "هزینه بیش از حد مجاز است.";
  }
  if (it.link.trim()) {
    try {
      const url = new URL(it.link.trim());
      if (url.protocol !== "https:" && url.protocol !== "http:")
        e.link = "پیوند باید با https:// شروع شود.";
    } catch {
      e.link = "پیوند معتبر نیست (مثل https://example.com).";
    }
  }
  if (it.note.trim().length > 200) e.note = "توضیحات حداکثر ۲۰۰ حرف است.";
  return e;
}

let seq = 0;
const key = () => `e${(seq += 1)}`;

function fromTour(tour: TourDetail): Days {
  const days: Days = {};
  for (let n = 1; n <= tour.durationDays; n += 1) {
    const d = tour.itinerary.find((x) => x.dayNumber === n);
    days[n] = {
      title: d?.title ?? "",
      items: (d?.items ?? []).map((it) => ({
        key: key(),
        id: it.id,
        type: it.type,
        title: it.title,
        startTime: it.startTime ?? "",
        location: it.location ?? "",
        note: it.note ?? "",
        cost: it.costToman !== null ? String(it.costToman) : "",
        link: it.link ?? "",
        status: it.status,
      })),
    };
  }
  return days;
}

/** Leader-only editor for the official day plan; changes are logged and members are notified. */
export function ItineraryEditor({ tour }: { tour: TourDetail }) {
  const [days, setDays] = useState<Days>(() => fromTour(tour));
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, ItemErrors>>({});
  const save = useUpdateItinerary(tour.id);
  const toast = useToast();

  const update = (day: number, fn: (items: EditItem[]) => EditItem[]) =>
    setDays((d) => ({
      ...d,
      [day]: { title: d[day]?.title ?? "", items: fn(d[day]?.items ?? []) },
    }));

  const move = (day: number, idx: number, dir: -1 | 1) =>
    update(day, (items) => {
      const to = idx + dir;
      if (to < 0 || to >= items.length) return items;
      const next = items.slice();
      const [m] = next.splice(idx, 1);
      if (m) next.splice(to, 0, m);
      return next;
    });

  const submit = () => {
    const bad: Record<string, ItemErrors> = {};
    entries(days).forEach(([, d]) =>
      d.items.forEach((i) => {
        const e = validateItem(i);
        if (Object.keys(e).length) bad[i.key] = e;
      }),
    );
    setErrors(bad);
    const firstBad = Object.keys(bad)[0];
    if (firstBad) {
      // Open the first invalid item so hidden fields (cost, link...) show their messages.
      if (
        Object.keys(bad[firstBad] ?? {}).some(
          (k) => k !== "title" && k !== "startTime",
        )
      )
        setOpenKey(firstBad);
      return toast.error("چند مورد از برنامه نیاز به اصلاح دارد.");
    }
    save.mutate(
      {
        changeNote: note.trim() || undefined,
        days: entries(days).map(([n, d]) => ({
          dayNumber: Number(n),
          title: d.title.trim(),
          items: d.items.map((i) => ({
            id: i.id,
            type: i.type,
            title: i.title.trim(),
            startTime: i.startTime || null,
            location: i.location.trim() || null,
            note: i.note.trim() || null,
            costToman: i.cost.trim()
              ? Number(toLatinDigits(i.cost).replace(/[^\d]/g, ""))
              : null,
            link: i.link.trim() || null,
            status: i.status,
          })),
        })),
      },
      {
        onSuccess: () => {
          setNote("");
          toast.success(
            "برنامه ذخیره شد؛ تغییرات در تاریخچه ثبت و به اعضا اطلاع داده شد.",
          );
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );
  };

  return (
    <div className="space-y-5">
      {entries(days).map(([n, d]) => {
        const day = Number(n);
        return (
          <section
            key={n}
            className="rounded-2xl border border-line bg-surface-muted/50 p-4"
            aria-label={`روز ${toFaDigits(day)}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-xl bg-forest-800 px-3 py-1.5 text-xs font-black text-white dark:bg-forest-500">
                روز {toFaDigits(day)}
              </span>
              <input
                value={d.title}
                onChange={(e) =>
                  setDays((all) => ({
                    ...all,
                    [day]: { ...d, title: e.target.value },
                  }))
                }
                placeholder="عنوان روز"
                aria-label={`عنوان روز ${toFaDigits(day)}`}
                maxLength={80}
                className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
              />
            </div>
            <ul className="mt-3 space-y-2">
              {d.items.map((it, idx) => {
                const expanded = openKey === it.key;
                const itemErrors = errors[it.key] ?? {};
                const set = (patch: Partial<EditItem>) => {
                  update(day, (items) =>
                    items.map((x) =>
                      x.key === it.key ? { ...x, ...patch } : x,
                    ),
                  );
                  if (errors[it.key])
                    setErrors((all) => ({
                      ...all,
                      [it.key]: validateItem({ ...it, ...patch }),
                    }));
                };
                const fieldCls = (f: keyof ItemErrors) =>
                  cn(
                    "rounded-xl border bg-surface text-sm outline-none focus:border-forest-400",
                    itemErrors[f] ? "border-danger" : "border-line",
                  );
                return (
                  <li
                    key={it.key}
                    className={cn(
                      "rounded-2xl border bg-surface p-3",
                      Object.keys(itemErrors).length
                        ? "border-danger"
                        : "border-line",
                    )}
                  >
                    <div className="grid gap-2 sm:grid-cols-[7.5rem_1fr_6rem_auto]">
                      <select
                        value={it.type}
                        onChange={(e) =>
                          set({ type: itemTypeSchema.parse(e.target.value) })
                        }
                        aria-label="نوع"
                        className="h-10 rounded-xl border border-line bg-surface px-2 text-sm"
                      >
                        {itemTypeSchema.options.map((t) => (
                          <option key={t} value={t}>
                            {ITEM_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                      <input
                        value={it.title}
                        onChange={(e) => set({ title: e.target.value })}
                        aria-label="عنوان"
                        aria-invalid={itemErrors.title ? true : undefined}
                        placeholder="عنوان (اقامتگاه، رستوران، جاذبه...)"
                        maxLength={80}
                        className={cn("h-10 px-3", fieldCls("title"))}
                      />
                      <input
                        type="time"
                        value={it.startTime}
                        onChange={(e) => set({ startTime: e.target.value })}
                        aria-label="ساعت"
                        aria-invalid={itemErrors.startTime ? true : undefined}
                        dir="ltr"
                        className={cn("h-10 px-2", fieldCls("startTime"))}
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="انتقال به بالا"
                          disabled={idx === 0}
                          onClick={() => move(day, idx, -1)}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                        >
                          <ArrowUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="انتقال به پایین"
                          disabled={idx === d.items.length - 1}
                          onClick={() => move(day, idx, 1)}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                        >
                          <ArrowDown className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="جزئیات بیشتر"
                          aria-expanded={expanded}
                          onClick={() => setOpenKey(expanded ? null : it.key)}
                          className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted"
                        >
                          <ChevronDown
                            className={cn(
                              "size-4 transition",
                              expanded && "rotate-180",
                            )}
                          />
                        </button>
                        <button
                          type="button"
                          aria-label="حذف"
                          onClick={() =>
                            update(day, (items) =>
                              items.filter((x) => x.key !== it.key),
                            )
                          }
                          className="inline-flex size-9 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    {expanded && (
                      <div className="mt-3 grid gap-2 border-t border-line pt-3 sm:grid-cols-2">
                        <input
                          value={it.location}
                          onChange={(e) => set({ location: e.target.value })}
                          placeholder="مکان / آدرس"
                          aria-label="مکان"
                          aria-invalid={itemErrors.location ? true : undefined}
                          maxLength={80}
                          className={cn("h-10 px-3", fieldCls("location"))}
                        />
                        <input
                          value={it.cost}
                          onChange={(e) => set({ cost: e.target.value })}
                          placeholder="هزینه تقریبی (تومان)"
                          aria-label="هزینه تقریبی"
                          aria-invalid={itemErrors.cost ? true : undefined}
                          inputMode="numeric"
                          className={cn("h-10 px-3", fieldCls("cost"))}
                        />
                        <input
                          value={it.link}
                          onChange={(e) => set({ link: e.target.value })}
                          placeholder="پیوند (https://...)"
                          aria-label="پیوند"
                          aria-invalid={itemErrors.link ? true : undefined}
                          dir="ltr"
                          maxLength={200}
                          className={cn("h-10 px-3", fieldCls("link"))}
                        />
                        <select
                          value={it.status}
                          onChange={(e) =>
                            set({
                              status: itemStatusSchema.parse(e.target.value),
                            })
                          }
                          aria-label="وضعیت"
                          className="h-10 rounded-xl border border-line bg-surface px-2 text-sm"
                        >
                          {itemStatusSchema.options.map((st) => (
                            <option key={st} value={st}>
                              {ITEM_STATUS_META[st].label}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={it.note}
                          onChange={(e) => set({ note: e.target.value })}
                          placeholder="توضیحات، ساعت ورود و خروج، نوع غذا، هزینه ورودی..."
                          aria-label="توضیحات"
                          maxLength={200}
                          className={cn(
                            "min-h-20 px-3 py-2 sm:col-span-2",
                            fieldCls("note"),
                          )}
                        />
                      </div>
                    )}
                    {Object.keys(itemErrors).length > 0 && (
                      <ul
                        role="alert"
                        className="mt-2 space-y-0.5 text-xs text-danger"
                      >
                        {Object.entries(itemErrors).map(([f, msg]) => (
                          <li key={f}>{msg}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                const item: EditItem = {
                  key: key(),
                  id: null,
                  type: "activity",
                  title: "",
                  startTime: "",
                  location: "",
                  note: "",
                  cost: "",
                  link: "",
                  status: "planned",
                };
                update(day, (items) => [...items, item]);
                setOpenKey(item.key);
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-forest-300 px-4 py-2 text-xs font-bold text-forest-700 transition hover:bg-surface dark:text-forest-200"
            >
              <Plus className="size-4" aria-hidden="true" />
              افزودن مورد
            </button>
          </section>
        );
      })}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          placeholder="توضیح تغییر برای اعضا (اختیاری) — مثلاً: به دلیل باران، بازدید به عصر منتقل شد"
          aria-label="توضیح تغییر"
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
        />
        <Button onClick={submit} loading={save.isPending}>
          ذخیره برنامه
        </Button>
      </div>
    </div>
  );
}
