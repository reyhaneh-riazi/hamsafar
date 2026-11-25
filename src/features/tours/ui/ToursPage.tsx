import { useEffect, useMemo, useState, type SelectHTMLAttributes } from "react";
import { ChevronDown, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { useSearchParams } from "react-router";
import bannerImage from "@/assets/images/hero-lake-road.webp";
import { FavoriteButton } from "@/features/favorites/ui/FavoriteButton";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate } from "@/shared/lib/format";
import { Container } from "@/shared/ui/Container";
import { Pagination } from "@/shared/ui/Pagination";
import { EmptyState, ErrorState } from "@/shared/ui/StateViews";
import {
  categorySchema,
  difficultySchema,
  tourSortSchema,
  type DescribedTour,
  type TourSearchParams,
} from "../api/tour-schemas";
import { useDescribeSearch, useDestinations, useTourList } from "../hooks";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_LABELS,
} from "../model/labels";
import { dateWindowToRange } from "../model/search-options";
import { SearchBox } from "./SearchBox";
import { TourCard, TourCardSkeletonGrid } from "./TourCard";

/** Figma shows 8 cards per page (2 rows × 4 on desktop). */
const PAGE_SIZE = 8;

const STYLE_OPTIONS = [
  { value: "", label: "همه سبک‌ها" },
  ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
];
const DATE_OPTIONS = [
  { value: "", label: "هر تاریخ" },
  { value: "7", label: "هفت روز آینده" },
  { value: "14", label: "دو هفته آینده" },
  { value: "30", label: "یک ماه آینده" },
  { value: "60", label: "دو ماه آینده" },
];
const BUDGET_SELECT = [
  { value: "", label: "هر بودجه" },
  { value: "3000000", label: "تا ۳ میلیون تومان" },
  { value: "5000000", label: "تا ۵ میلیون تومان" },
  { value: "8000000", label: "تا ۸ میلیون تومان" },
  { value: "12000000", label: "تا ۱۲ میلیون تومان" },
];
const SORTS = [
  { value: "soonest", label: "نزدیک‌ترین تاریخ" },
  { value: "relevance", label: "پیشنهاد همسفر" },
  { value: "newest", label: "تازه‌ترین" },
  { value: "spots", label: "بیشترین جای خالی" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
] as const;
const SMART_SORTS = [
  { value: "match", label: "بیشترین تناسب" },
  { value: "soonest", label: "نزدیک‌ترین تاریخ" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "spots", label: "بیشترین جای خالی" },
] as const;

/** All search state lives in the URL so results are shareable and survive refresh/back. */
function useTourSearchState() {
  const [params, setParams] = useSearchParams();
  const sort = tourSortSchema.safeParse(params.get("sort")).data ?? "soonest";
  const state = {
    q: params.get("q") ?? "",
    describe: params.get("mode") === "describe",
    destination: params.get("destination") ?? "",
    category: categorySchema.safeParse(params.get("category")).data,
    difficulty: difficultySchema.safeParse(params.get("difficulty")).data,
    maxPrice: params.get("maxPrice") ?? "",
    when: params.get("when") ?? "",
    /** Exact departure date from the home date picker (YYYY-MM-DD). */
    from: /^\d{4}-\d{2}-\d{2}$/.test(params.get("from") ?? "")
      ? (params.get("from") ?? "")
      : "",
    sort,
    smartSort: params.get("ssort") ?? "match",
    page: Math.max(1, Number(params.get("page")) || 1),
  };

  const update = (
    patch: Record<string, string | undefined>,
    resetPage = true,
  ) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([k, v]) =>
        v ? next.set(k, v) : next.delete(k),
      );
      if (resetPage && !("page" in patch)) next.delete("page");
      return next;
    });
  };
  return { state, update, clear: () => setParams(new URLSearchParams()) };
}

/** Native select styled as the Figma «Options» control (42px, rounded-xl, chevron on the left). */
function ToolbarSelect({
  label,
  options,
  className,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <select
        {...rest}
        className="h-[42px] w-full appearance-none rounded-xl border border-slate-200 bg-surface ps-[13px] pe-9 text-sm font-medium text-gray-800 outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-500/10 dark:border-line dark:text-ink"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-2.5 top-1/2 size-[18px] -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
    </label>
  );
}

export function ToursPage() {
  useDocumentTitle("تورهای گروهی");
  const { state, update, clear } = useTourSearchState();
  const { data: destinations } = useDestinations();

  // Toolbar selections are staged and applied with «اعمال فیلتر» (Figma behaviour).
  const [staged, setStaged] = useState({
    category: state.category ?? "",
    when: state.when,
    maxPrice: state.maxPrice,
  });
  useEffect(
    () =>
      setStaged({
        category: state.category ?? "",
        when: state.when,
        maxPrice: state.maxPrice,
      }),
    [state.category, state.when, state.maxPrice],
  );

  const listParams = useMemo<TourSearchParams>(
    () => ({
      q: state.describe ? undefined : state.q || undefined,
      destination: state.destination || undefined,
      category: state.category,
      difficulty: state.difficulty,
      maxPrice: Number(state.maxPrice) || undefined,
      ...dateWindowToRange(state.when),
      ...(state.from ? { from: state.from } : {}),
      sort: state.sort,
      page: state.page,
      pageSize: PAGE_SIZE,
    }),
    [
      state.describe,
      state.q,
      state.destination,
      state.category,
      state.difficulty,
      state.maxPrice,
      state.when,
      state.from,
      state.sort,
      state.page,
    ],
  );

  const describeMode = state.describe && state.q.length >= 2;
  const list = useTourList(listParams, !describeMode);
  const described = useDescribeSearch(describeMode ? state.q : "");
  const destinationName =
    destinations?.find((d) => d.id === state.destination)?.name ??
    state.destination;

  const chips = [
    state.q && !describeMode ? { key: "q", label: `«${state.q}»` } : null,
    state.destination
      ? { key: "destination", label: `مقصد: ${destinationName}` }
      : null,
    state.difficulty
      ? {
          key: "difficulty",
          label: `سختی: ${DIFFICULTY_LABELS[state.difficulty]}`,
        }
      : null,
    state.from ? { key: "from", label: `از ${formatDate(state.from)}` } : null,
  ].filter((c): c is { key: string; label: string } => c !== null);

  return (
    <div className="pb-16">
      {/* Figma «Section - Tours Top Banner» (129:2683) */}
      <section className="relative overflow-hidden bg-[#1c3c34] px-4 pb-16 pt-14 text-center sm:pb-14">
        <img
          src={bannerImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[50%_40%] opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(28,60,52,0.85)] via-[rgba(0,0,0,0.3)] to-[rgba(28,60,52,0.9)]" />
        <div className="relative mx-auto max-w-4xl">
          <p className="text-xs font-bold leading-4 text-[#e8604c]">
            سفر بعدی همین‌جاست
          </p>
          <h1 className="mt-1 text-4xl font-black leading-[48px] text-white sm:text-5xl">
            تورهای گروهی
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            از طبیعت‌گردی سبک تا ماجراجویی جدی؛ با فیلترهای دقیق تور مناسب خودت
            را پیدا کن.
          </p>
        </div>
      </section>

      <Container className="relative z-[2] -mt-6">
        {/* Figma «Section - Filtering Toolbar» (129:2951) */}
        <SearchBox
          layout="toolbar"
          submitLabel="اعمال فیلتر"
          initialText={state.q}
          initialMode={state.describe ? "smart" : "keyword"}
          destinations={destinations}
          searching={
            describeMode
              ? described.isFetching
              : list.isFetching && Boolean(state.q)
          }
          onSearch={(q, mode) =>
            update({
              q: q || undefined,
              mode: q && mode === "smart" ? "describe" : undefined,
              category: staged.category || undefined,
              when: staged.when || undefined,
              maxPrice: staged.maxPrice || undefined,
            })
          }
          onPickDestination={(id) =>
            update({ destination: id, q: undefined, mode: undefined })
          }
        >
          <ToolbarSelect
            label="سبک سفر"
            value={staged.category}
            onChange={(e) =>
              setStaged((s) => ({ ...s, category: e.target.value }))
            }
            options={STYLE_OPTIONS}
          />
          <ToolbarSelect
            label="تاریخ سفر"
            value={staged.when}
            onChange={(e) => setStaged((s) => ({ ...s, when: e.target.value }))}
            options={DATE_OPTIONS}
          />
          <ToolbarSelect
            label="بودجه"
            value={staged.maxPrice}
            onChange={(e) =>
              setStaged((s) => ({ ...s, maxPrice: e.target.value }))
            }
            options={BUDGET_SELECT}
          />
        </SearchBox>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => update({ [c.key]: undefined })}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
                aria-label={`حذف فیلتر ${c.label}`}
              >
                {c.label}
                <X className="size-3.5" aria-hidden="true" />
              </button>
            ))}
            <button
              type="button"
              onClick={clear}
              className="text-xs font-bold text-coral-500 hover:text-coral-600"
            >
              حذف همه
            </button>
          </div>
        )}

        {describeMode ? (
          <DescribeResults
            query={state.q}
            data={described.data?.items}
            understood={described.data?.understood}
            isPending={described.isPending}
            isError={described.isError}
            error={described.error}
            onRetry={() => void described.refetch()}
            onUseKeywords={() => update({ mode: undefined })}
            filters={{
              category: state.category,
              maxPrice: Number(state.maxPrice) || undefined,
              ...dateWindowToRange(state.when),
            }}
            sort={state.smartSort}
            onSort={(v) =>
              update({ ssort: v === "match" ? undefined : v }, false)
            }
            onClearFilters={() =>
              update({
                category: undefined,
                when: undefined,
                maxPrice: undefined,
              })
            }
          />
        ) : (
          <section aria-labelledby="results-title" aria-busy={list.isFetching}>
            {/* Figma «Section - Listing Header & Sorting» (129:2669) */}
            <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-10">
              <div>
                <h2
                  id="results-title"
                  className="text-2xl font-black leading-8 text-slate-900 dark:text-white"
                >
                  تورهای باز و در انتظار حد نصاب
                </h2>
                <p
                  className="mt-1 text-xs font-medium leading-4 text-slate-500 dark:text-ink-muted"
                  aria-live="polite"
                >
                  {list.data
                    ? `${toFaDigits(list.data.total)} نتیجه مرتبط پیدا شد`
                    : list.isError
                      ? "نتیجه‌ای دریافت نشد"
                      : "در حال جست‌وجو..."}
                </p>
              </div>
              <SortControl
                value={state.sort}
                options={SORTS}
                onChange={(v) =>
                  update({ sort: v === "soonest" ? undefined : v })
                }
              />
            </div>

            {list.isError ? (
              <ErrorState
                error={list.error}
                text="دریافت فهرست تورها ممکن نشد."
                onRetry={() => void list.refetch()}
              />
            ) : list.data && list.data.items.length === 0 ? (
              <EmptyState
                title="توری با این مشخصات پیدا نشد"
                text="فیلترها را کمتر کنید یا سفرتان را با جست‌وجوی هوشمند توصیف کنید."
                action={
                  <button
                    type="button"
                    onClick={clear}
                    className="text-sm font-bold text-coral-500"
                  >
                    حذف همه فیلترها
                  </button>
                }
              />
            ) : (
              <div
                className={cn(
                  "grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
                  list.isPlaceholderData && "opacity-60",
                )}
              >
                {!list.data && <TourCardSkeletonGrid count={PAGE_SIZE} />}
                {list.data?.items.map((t, i) => (
                  <div
                    key={t.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <TourCard
                      tour={t}
                      action={<FavoriteButton tour={t} />}
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            )}
            {list.data && (
              <Pagination
                page={list.data.page}
                pageSize={list.data.pageSize}
                total={list.data.total}
                onChange={(p) => {
                  update({ page: p > 1 ? String(p) : undefined }, false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            )}
          </section>
        )}
      </Container>
    </div>
  );
}

function SortControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-500 dark:text-ink-muted">
        مرتب‌سازی:
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[30px] appearance-none rounded-xl border border-slate-200 bg-surface ps-[13px] pe-8 text-xs font-bold text-slate-700 outline-none focus:border-forest-400 dark:border-line dark:text-ink"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute end-2 top-1/2 size-4 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
      </span>
    </label>
  );
}

interface DescribeResultsProps {
  query: string;
  data: DescribedTour[] | undefined;
  understood: string[] | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onUseKeywords: () => void;
  /** Toolbar filters applied to the (complete, unpaginated) smart-search result list. */
  filters: { category?: string; maxPrice?: number; from?: string; to?: string };
  sort: string;
  onSort: (v: string) => void;
  onClearFilters: () => void;
}

/** Smart-search results: what was understood, match score and reasons, plus filter and sort. */
function DescribeResults({
  query,
  data,
  understood,
  isPending,
  isError,
  error,
  onRetry,
  onUseKeywords,
  filters,
  sort,
  onSort,
  onClearFilters,
}: DescribeResultsProps) {
  const filtered = useMemo(() => {
    if (!data) return undefined;
    const items = data.filter(
      (t) =>
        (!filters.category ||
          t.categories.includes(
            filters.category as DescribedTour["categories"][number],
          )) &&
        (!filters.maxPrice || t.priceToman <= filters.maxPrice) &&
        (!filters.from || t.startDate >= filters.from) &&
        (!filters.to || t.startDate <= filters.to),
    );
    const sorted = items.slice();
    if (sort === "soonest")
      sorted.sort((a, b) => a.startDate.localeCompare(b.startDate));
    else if (sort === "price_asc")
      sorted.sort((a, b) => a.priceToman - b.priceToman);
    else if (sort === "spots")
      sorted.sort(
        (a, b) =>
          b.capacity - b.confirmedCount - (a.capacity - a.confirmedCount),
      );
    else sorted.sort((a, b) => b.matchScore - a.matchScore);
    return sorted;
  }, [
    data,
    filters.category,
    filters.maxPrice,
    filters.from,
    filters.to,
    sort,
  ]);
  const hasFilters = Boolean(
    filters.category || filters.maxPrice || filters.from,
  );

  return (
    <section aria-labelledby="describe-title" className="pt-8">
      <div className="rounded-2xl border border-forest-100 bg-surface-muted p-5 dark:border-line">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="describe-title"
            className="flex items-center gap-2 text-base font-black"
          >
            <Sparkles className="size-5 text-coral-500" aria-hidden="true" />
            برداشت ما از درخواستت
          </h2>
          <button
            type="button"
            onClick={onUseKeywords}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-700 hover:text-coral-500 dark:text-forest-200"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            جست‌وجوی عادی با همین متن
          </button>
        </div>
        <p className="mt-2 text-sm text-ink-muted">«{query}»</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {understood?.length ? (
            understood.map((c) => (
              <span
                key={c}
                className="rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-forest-700 shadow-sm dark:text-forest-200"
              >
                {c}
              </span>
            ))
          ) : (
            <span className="text-xs text-ink-soft">
              {isPending
                ? "در حال تحلیل..."
                : "نکته خاصی تشخیص داده نشد؛ نتایج بر اساس کلمات متن است."}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 pt-8">
        <div>
          <h3 className="text-2xl font-black leading-8 text-slate-900 dark:text-white">
            نتایج جست‌وجوی هوشمند
          </h3>
          <p
            className="mt-1 text-xs font-medium text-slate-500 dark:text-ink-muted"
            aria-live="polite"
          >
            {filtered
              ? `${toFaDigits(filtered.length)} تور متناسب${hasFilters && data ? ` (از ${toFaDigits(data.length)} نتیجه، با فیلترهای انتخابی)` : ""}`
              : isError
                ? "نتیجه‌ای دریافت نشد"
                : "در حال تحلیل..."}
          </p>
        </div>
        <SortControl value={sort} options={SMART_SORTS} onChange={onSort} />
      </div>

      {isError ? (
        <ErrorState
          error={error}
          text="جست‌وجوی هوشمند ممکن نشد."
          onRetry={onRetry}
        />
      ) : filtered && filtered.length === 0 ? (
        <EmptyState
          title={
            data && data.length > 0
              ? "با این فیلترها نتیجه‌ای نماند"
              : "توری متناسب با توضیحت پیدا نشد"
          }
          text={
            data && data.length > 0
              ? "سبک، تاریخ یا بودجه را بازتر کنید."
              : "جزئیات کمتری بنویس یا جست‌وجوی عادی را امتحان کن."
          }
          icon={<X className="size-7" />}
          action={
            hasFilters ? (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-sm font-bold text-coral-500"
              >
                حذف فیلترها
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {!filtered && isPending && <TourCardSkeletonGrid count={4} />}
          {filtered?.map((t, i) => (
            <div
              key={t.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <TourCard
                tour={t}
                className="h-full"
                action={<FavoriteButton tour={t} />}
                footnote={
                  <div className="relative z-[1]">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-forest-700 dark:text-forest-200">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-forest-100 dark:bg-forest-900">
                        <span
                          className="block h-full rounded-full bg-forest-500"
                          style={{ width: `${t.matchScore}%` }}
                        />
                      </span>
                      {toFaDigits(t.matchScore)}٪ تناسب
                    </div>
                    {t.matchReasons.length > 0 && (
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-ink-soft">
                        {t.matchReasons.join(" · ")}
                      </p>
                    )}
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
