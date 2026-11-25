import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarPlus,
  Check,
  ClipboardList,
  CloudUpload,
  FileClock,
  HardDriveDownload,
  MapPinned,
  Plus,
  Route,
  Trash2,
  Users,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useSession } from "@/features/auth/hooks";
import {
  categorySchema,
  difficultySchema,
  itemTypeSchema,
} from "@/features/tours/api/tour-schemas";
import { useSaveTourDraft, useTourDetail } from "@/features/tours/hooks";
import {
  CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  ITEM_TYPE_LABELS,
  STATUS_META,
} from "@/features/tours/model/labels";
import { DayTabs, dayPanelId, dayTabId } from "@/features/tours/ui/DayTabs";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { addDays, todayIso } from "@/shared/lib/dates";
import { toFaDigits, toLatinDigits } from "@/shared/lib/digits";
import {
  formatDate,
  formatDateTime,
  formatNumber,
  formatToman,
  formatTomanShort,
  formatWeekday,
} from "@/shared/lib/format";
import { safeStorage } from "@/shared/lib/storage";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Container } from "@/shared/ui/Container";
import { SelectField, TextArea, TextField } from "@/shared/ui/Field";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState, ErrorState, PageLoader } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import {
  EMPTY_DRAFT,
  LIMITS,
  STEP_COUNT,
  dateOfDay,
  dayErrorKey,
  dayOf,
  draftReducer,
  draftStorageKey,
  endDateOf,
  firstInvalidStep,
  fromTourDetail,
  invalidDays,
  isPristine,
  itemErrorKey,
  mapServerFieldErrors,
  parseStoredDraft,
  serializeDraft,
  toCreateBody,
  validateStep,
  type DraftErrors,
  type StoredDraft,
  type TourDraft,
} from "../model/tour-draft";

const STEPS = [
  { id: "basics", label: "اطلاعات پایه", icon: MapPinned },
  { id: "capacity", label: "زمان، بودجه و ظرفیت", icon: Users },
  { id: "plan", label: "برنامه روزانه", icon: Route },
  { id: "review", label: "بازبینی", icon: ClipboardList },
] as const;

const BASICS_KEYS = [
  "title",
  "destination",
  "province",
  "categories",
  "difficulty",
  "description",
];
const SCHEDULE_KEYS = [
  "startDate",
  "durationDays",
  "capacity",
  "minParticipants",
  "priceToman",
  "meetingPoint",
];

function stepOfField(key: string): number {
  if (BASICS_KEYS.includes(key)) return 0;
  if (SCHEDULE_KEYS.includes(key)) return 1;
  return 2;
}

/** Digits only, Persian/Arabic digits accepted; empty input → null (not zero). */
function parseCount(value: string): number | null {
  const digits = toLatinDigits(value).replace(/[^\d]/g, "");
  return digits === "" ? null : Number(digits);
}

/* ======================================================================================
   Route component: new tour, or re-open a server draft with `?draft=<tourId>`.
   ====================================================================================== */
export function PlannerPage() {
  useDocumentTitle("برنامه‌ریز سفر");
  const [params] = useSearchParams();
  const draftId = params.get("draft");
  return draftId ? (
    <ServerDraftLoader key={draftId} tourId={draftId} />
  ) : (
    <PlannerWizard key="new" serverId={null} initial={EMPTY_DRAFT} />
  );
}

function ServerDraftLoader({ tourId }: { tourId: string }) {
  const {
    data: tour,
    isPending,
    isError,
    error,
    refetch,
  } = useTourDetail(tourId);
  if (isPending) return <PageLoader />;
  if (isError || !tour) {
    return (
      <Container className="py-16">
        {error instanceof ApiError && error.status === 404 ? (
          <EmptyState
            title="این پیش‌نویس پیدا نشد"
            text="ممکن است حذف شده باشد."
            action={<ButtonLink to="/planner">ساخت تور جدید</ButtonLink>}
          />
        ) : (
          <ErrorState
            text="دریافت پیش‌نویس ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
      </Container>
    );
  }
  if (!tour.viewer.isCreator || tour.status !== "draft") {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<FileClock className="size-7" />}
          title="این تور دیگر پیش‌نویس نیست"
          text={`وضعیت فعلی: ${STATUS_META[tour.status].label}. تغییرات مجاز از صفحه مدیریت تور انجام می‌شود.`}
          action={
            <ButtonLink
              to={
                tour.viewer.canManage
                  ? `/tours/${tour.id}/manage`
                  : `/tours/${tour.id}`
              }
            >
              رفتن به تور
            </ButtonLink>
          }
        />
      </Container>
    );
  }
  return <PlannerWizard serverId={tour.id} initial={fromTourDetail(tour)} />;
}

/* ======================================================================================
   Local autosave: a copy on this device so nothing is lost on refresh or a closed tab.
   It is never treated as saved on the server.
   ====================================================================================== */
function useLocalDraft(userId: string | undefined, serverId: string | null) {
  const key = userId ? draftStorageKey(userId) : null;
  const [stored] = useState<StoredDraft | null>(() =>
    key ? parseStoredDraft(safeStorage.get(key)) : null,
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  /** Serialized copy waiting for the debounce; flushed if the page unmounts first. */
  const pending = useRef<string | null>(null);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (key && pending.current) safeStorage.set(key, pending.current);
    },
    [key],
  );

  const schedule = useCallback(
    (draft: TourDraft, step: number) => {
      if (!key) return;
      window.clearTimeout(timer.current);
      pending.current = serializeDraft(draft, step, serverId);
      timer.current = window.setTimeout(() => {
        if (pending.current) safeStorage.set(key, pending.current);
        pending.current = null;
        setSavedAt(new Date().toISOString());
      }, 500);
    },
    [key, serverId],
  );

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    pending.current = null;
    if (key) safeStorage.remove(key);
    setSavedAt(null);
  }, [key]);

  return {
    /** A copy that belongs to the draft being opened (same server draft, or both new). */
    restorable: stored && stored.serverId === serverId ? stored : null,
    /** A copy of a *different* server draft (offer to open it). */
    other: stored && stored.serverId !== serverId ? stored : null,
    savedAt,
    schedule,
    clear,
  };
}

/* ====================================================================================== */
function PlannerWizard({
  serverId,
  initial,
}: {
  serverId: string | null;
  initial: TourDraft;
}) {
  const { user } = useSession();
  const [currentServerId, setCurrentServerId] = useState<string | null>(serverId);
  const [draft, dispatch] = useReducer(draftReducer, initial);
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [attempted, setAttempted] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [serverErrors, setServerErrors] = useState<DraftErrors>({});
  const [activeDay, setActiveDay] = useState(1);
  const local = useLocalDraft(user?.id, currentServerId);
  const [restoreDecided, setRestoreDecided] = useState(
    local.restorable === null,
  );
  const save = useSaveTourDraft();
  const toast = useToast();
  const navigate = useNavigate();
  const today = todayIso();

  const live = useMemo(
    () => validateStep(step, draft, today),
    [step, draft, today],
  );
  const planErrors = useMemo(
    () => validateStep(2, draft, today),
    [draft, today],
  );
  const badDays = useMemo(
    () => invalidDays(draft, attempted.has(2) ? planErrors : {}),
    [draft, planErrors, attempted],
  );
  const duration = draft.durationDays ?? 0;
  const currentDay = Math.min(Math.max(1, activeDay), Math.max(1, duration));
  const endDate = endDateOf(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  // Autosave after the user has decided what to do with an older local copy.
  const { schedule } = local;
  useEffect(() => {
    if (!restoreDecided || !dirty || isPristine(draft)) return;
    schedule(draft, step);
  }, [draft, step, restoreDecided, dirty, schedule]);

  const err = (key: string): string | undefined =>
    serverErrors[key] ??
    (attempted.has(step) || touched.has(key) ? live[key] : undefined);
  const touch = (...keys: string[]) =>
    setTouched((prev) => new Set([...prev, ...keys]));

  const set = (patch: Partial<TourDraft>) => {
    dispatch({ type: "set", patch });
    const keys = Object.keys(patch);
    if (keys.some((k) => serverErrors[k]))
      setServerErrors((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([k]) => !keys.includes(k)),
        ),
      );
  };

  const focusFirstError = () =>
    window.requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>('[data-planner] [aria-invalid="true"]')
        ?.focus(),
    );

  const goTo = (target: number) => {
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const next = () => {
    setAttempted((prev) => new Set(prev).add(step));
    if (Object.keys(live).length === 0)
      goTo(Math.min(STEP_COUNT - 1, step + 1));
    else {
      if (step === 2) {
        const first = invalidDays(draft, live).values().next().value;
        if (first !== undefined) setActiveDay(first);
      }
      toast.error("چند مورد نیاز به اصلاح دارد.");
      focusFirstError();
    }
  };

  const persist = (submit: boolean) => {
    const invalid = firstInvalidStep(draft, today);
    if (invalid.step >= 0) {
      setAttempted((prev) => new Set(prev).add(invalid.step));
      setStep(invalid.step);
      toast.error(
        submit
          ? "قبل از ارسال، موارد مشخص‌شده را کامل کنید."
          : "برای ذخیره پیش‌نویس در حساب کاربری، موارد مشخص‌شده را کامل کنید. نسخه این دستگاه خودکار ذخیره شده است.",
      );
      focusFirstError();
      return;
    }
    save.mutate(
      { draftId: currentServerId, body: toCreateBody(draft, submit) },
      {
        onSuccess: (res) => {
          local.clear();
          toast.success(
            submit
              ? "تور برای بررسی مدیر ارسال شد."
              : "پیش‌نویس در حساب کاربری شما ذخیره شد.",
          );
          if (submit) {
            navigate(`/tours/${res.id}`);
          } else {
            setCurrentServerId(res.id);
            if (typeof window !== "undefined") {
              window.history.replaceState(
                null,
                "",
                `/planner?draft=${encodeURIComponent(res.id)}`,
              );
            }
          }
        },
        onError: (error) => {
          if (
            error instanceof ApiError &&
            Object.keys(error.fieldErrors).length > 0
          ) {
            const mapped = mapServerFieldErrors(error.fieldErrors);
            setServerErrors(mapped);
            const firstKey = Object.keys(mapped)[0];
            if (firstKey) setStep(stepOfField(firstKey));
          }
          toast.error(errorMessage(error));
        },
      },
    );
  };

  const restore = (copy: StoredDraft) => {
    dispatch({ type: "replace", draft: copy.draft });
    setStep(copy.step);
    setRestoreDecided(true);
    toast.success("پیش‌نویس بازگردانی شد.");
  };

  const discard = () => {
    local.clear();
    setRestoreDecided(true);
  };

  return (
    <div className="pb-12" data-planner>
      <PageHeader
        title="برنامه‌ریز سفر"
        subtitle={
          serverId
            ? "در حال ویرایش پیش‌نویس ذخیره‌شده. هر وقت آماده بود، برای بررسی مدیر ارسالش کن."
            : "تور گروهی‌ات رو قدم به قدم بساز: از مقصد و ظرفیت تا برنامه روز به روز. پس از تأیید مدیر، تور منتشر می‌شود."
        }
        crumbs={[{ label: "خانه", to: "/" }, { label: "برنامه‌ریز سفر" }]}
      >
        <StepIndicator step={step} onBack={(i) => i < step && goTo(i)} />
      </PageHeader>

      <div className="mx-auto mt-8 max-w-4xl space-y-4 px-4 sm:px-6">
        {!restoreDecided && local.restorable && (
          <Notice icon={<HardDriveDownload className="size-5" />} tone="mint">
            <p className="text-sm font-bold">
              یک پیش‌نویس ذخیره‌نشده روی این دستگاه داری.
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              «{local.restorable.draft.title.trim() || "بدون نام"}» · آخرین
              تغییر {formatDateTime(local.restorable.savedAt)}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => local.restorable && restore(local.restorable)}
              >
                ادامه همان پیش‌نویس
              </Button>
              <Button size="sm" variant="ghost" onClick={discard}>
                {serverId ? "نسخه ذخیره‌شده در حساب" : "شروع از نو"}
              </Button>
            </div>
          </Notice>
        )}
        {!serverId && local.other?.serverId && (
          <Notice icon={<FileClock className="size-5" />} tone="butter">
            <p className="text-sm">
              تغییرات ذخیره‌نشده‌ای برای پیش‌نویس «
              {local.other.draft.title.trim() || "بدون نام"}» داری.{" "}
              <Link
                to={`/planner?draft=${encodeURIComponent(local.other.serverId)}`}
                className="font-bold text-coral-500 hover:text-coral-600"
              >
                باز کردن آن پیش‌نویس
              </Link>
            </p>
          </Notice>
        )}

        <div
          key={step}
          className="animate-fade-up rounded-panel border border-line bg-surface p-5 shadow-card sm:p-8"
        >
          {step === 0 && (
            <BasicsStep draft={draft} set={set} err={err} touch={touch} />
          )}
          {step === 1 && (
            <ScheduleStep
              draft={draft}
              set={set}
              err={err}
              touch={touch}
              today={today}
              endDate={endDate}
            />
          )}
          {step === 2 && (
            <PlanStep
              draft={draft}
              dispatch={dispatch}
              activeDay={currentDay}
              onDay={setActiveDay}
              badDays={badDays}
              err={(k) =>
                serverErrors[k] ??
                (attempted.has(2) || touched.has(k) ? planErrors[k] : undefined)
              }
              touch={touch}
            />
          )}
          {step === 3 && (
            <ReviewStep draft={draft} endDate={endDate} onEdit={goTo} />
          )}

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              onClick={() => goTo(Math.max(0, step - 1))}
              disabled={step === 0 || save.isPending}
              icon={<ArrowRight className="size-4" />}
            >
              مرحله قبل
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SaveStatus savedAt={local.savedAt} />
              <Button
                variant="outline"
                onClick={() => persist(false)}
                loading={
                  save.isPending && save.variables?.body.submit === false
                }
                disabled={save.isPending}
                icon={<CloudUpload className="size-4" />}
              >
                ذخیره پیش‌نویس
              </Button>
              {step < STEP_COUNT - 1 ? (
                <Button
                  onClick={next}
                  iconEnd={<ArrowLeft className="size-4" />}
                >
                  مرحله بعد
                </Button>
              ) : (
                <Button
                  onClick={() => persist(true)}
                  loading={
                    save.isPending && save.variables?.body.submit === true
                  }
                  disabled={save.isPending}
                >
                  ارسال برای بررسی
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- small pieces */
function StepIndicator({
  step,
  onBack,
}: {
  step: number;
  onBack: (i: number) => void;
}) {
  return (
    <ol className="grid grid-cols-4 gap-2 rounded-[1.4rem] border border-line bg-surface p-2 shadow-float sm:p-3">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = i < step;
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onBack(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-3 text-center text-[11px] font-bold leading-5 transition sm:flex-row sm:justify-center sm:text-sm",
                i === step
                  ? "bg-forest-800 text-white dark:bg-forest-500"
                  : done
                    ? "text-forest-700 hover:bg-surface-muted dark:text-forest-200"
                    : "text-ink-soft",
              )}
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  i === step
                    ? "bg-white/15"
                    : done
                      ? "bg-forest-100 dark:bg-forest-900"
                      : "bg-surface-muted",
                )}
              >
                {done ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <Icon className="size-4" aria-hidden="true" />
                )}
              </span>
              {s.label}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function Notice({
  icon,
  tone,
  children,
}: {
  icon: ReactNode;
  tone: "mint" | "butter";
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-2xl border border-line p-4",
        tone === "mint" ? "bg-tint-mint" : "bg-tint-butter",
      )}
    >
      <span className="mt-0.5 shrink-0 text-forest-700 dark:text-forest-200">
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SaveStatus({ savedAt }: { savedAt: string | null }) {
  if (!savedAt) return null;
  return (
    <span className="text-center text-[11px] text-ink-soft" aria-live="polite">
      ذخیره خودکار روی این دستگاه · {formatDateTime(savedAt)}
    </span>
  );
}

interface StepProps {
  draft: TourDraft;
  set: (patch: Partial<TourDraft>) => void;
  err: (key: string) => string | undefined;
  touch: (...keys: string[]) => void;
}

/* ---------------------------------------------------------------- step 1 */
function BasicsStep({ draft, set, err, touch }: StepProps) {
  const counter = (value: string, max: number) =>
    `${toFaDigits(value.trim().length)} از ${toFaDigits(max)} حرف`;
  return (
    <div className="grid gap-5">
      <TextField
        label="نام تور"
        required
        value={draft.title}
        onChange={(e) => set({ title: e.target.value })}
        onBlur={() => touch("title")}
        error={err("title")}
        hint={counter(draft.title, LIMITS.titleMax)}
        placeholder="مثلاً: کمپینگ آخر هفته در کویر مرنجاب"
        maxLength={LIMITS.titleMax}
        autoComplete="off"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="مقصد"
          required
          value={draft.destination}
          onChange={(e) => set({ destination: e.target.value })}
          onBlur={() => touch("destination")}
          error={err("destination")}
          placeholder="شهر یا منطقه"
          maxLength={LIMITS.destinationMax}
        />
        <TextField
          label="استان"
          required
          value={draft.province}
          onChange={(e) => set({ province: e.target.value })}
          onBlur={() => touch("province")}
          error={err("province")}
          maxLength={LIMITS.provinceMax}
        />
      </div>
      <fieldset
        aria-describedby={err("categories") ? "categories-error" : undefined}
      >
        <legend className="mb-3 text-sm font-bold">
          سبک سفر{" "}
          <span className="text-coral-600" aria-hidden="true">
            *
          </span>
          <span className="ms-2 text-xs font-normal text-ink-soft">
            یک یا چند مورد
          </span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {categorySchema.options.map((c) => (
            <Chip
              key={c}
              selected={draft.categories.includes(c)}
              aria-invalid={err("categories") ? true : undefined}
              onClick={() => {
                set({
                  categories: draft.categories.includes(c)
                    ? draft.categories.filter((x) => x !== c)
                    : [...draft.categories, c],
                });
                touch("categories");
              }}
            >
              {draft.categories.includes(c) && (
                <Check className="size-3.5" aria-hidden="true" />
              )}
              {CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </div>
        {err("categories") && (
          <p
            id="categories-error"
            role="alert"
            className="mt-2 text-xs font-medium text-danger"
          >
            {err("categories")}
          </p>
        )}
      </fieldset>
      <SelectField
        label="سطح سختی"
        required
        value={draft.difficulty}
        placeholder="انتخاب کنید"
        onChange={(e) => {
          const parsed = difficultySchema.safeParse(e.target.value);
          set({ difficulty: parsed.success ? parsed.data : "" });
          touch("difficulty");
        }}
        onBlur={() => touch("difficulty")}
        error={err("difficulty")}
        hint="آسان: مناسب همه · نیمه‌سنگین: آمادگی جسمانی متوسط · سخت: تجربه و آمادگی بالا"
        options={difficultySchema.options.map((d) => ({
          value: d,
          label: DIFFICULTY_LABELS[d],
        }))}
      />
      <TextArea
        label="شرح سفر"
        required
        value={draft.description}
        onChange={(e) => set({ description: e.target.value })}
        onBlur={() => touch("description")}
        error={err("description")}
        maxLength={LIMITS.descriptionMax}
        hint={`${counter(draft.description, LIMITS.descriptionMax)} · حداقل ${toFaDigits(LIMITS.descriptionMin)} حرف`}
        placeholder="سفر چطور است؟ برای چه کسانی مناسب است؟ چه چیزهایی شامل می‌شود؟"
      />
    </div>
  );
}

/* ---------------------------------------------------------------- step 2 */
function ScheduleStep({
  draft,
  set,
  err,
  touch,
  today,
  endDate,
}: StepProps & { today: string; endDate: string | null }) {
  const minParticipantsHint =
    draft.capacity !== null
      ? `حداکثر ${toFaDigits(draft.capacity)} نفر (برابر ظرفیت). اگر تا تاریخ حرکت به این تعداد نرسد، تور طبق قوانین لغو می‌شود.`
      : undefined;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        label="تاریخ شروع"
        type="date"
        required
        dir="ltr"
        min={addDays(today, 1)}
        max={addDays(today, LIMITS.maxDaysAhead)}
        value={draft.startDate}
        onChange={(e) => {
          set({ startDate: e.target.value });
          touch("startDate");
        }}
        onBlur={() => touch("startDate")}
        error={err("startDate")}
        hint={
          draft.startDate && !err("startDate")
            ? `${formatWeekday(draft.startDate)} ${formatDate(draft.startDate)}`
            : "از فردا تا یک سال آینده"
        }
      />
      <TextField
        label="مدت سفر (روز)"
        inputMode="numeric"
        required
        value={
          draft.durationDays === null ? "" : toFaDigits(draft.durationDays)
        }
        onChange={(e) => set({ durationDays: parseCount(e.target.value) })}
        onBlur={() => touch("durationDays")}
        error={err("durationDays")}
        hint={
          endDate && !err("durationDays")
            ? `پایان سفر: ${formatWeekday(endDate)} ${formatDate(endDate)}`
            : `بین ${toFaDigits(LIMITS.durationMin)} تا ${toFaDigits(LIMITS.durationMax)} روز`
        }
      />
      <TextField
        label="ظرفیت کل (نفر)"
        inputMode="numeric"
        required
        value={draft.capacity === null ? "" : toFaDigits(draft.capacity)}
        onChange={(e) => {
          const capacity = parseCount(e.target.value);
          set({ capacity });
          // Cross-field rule: surface the quorum error as soon as capacity drops below it.
          if (
            capacity !== null &&
            draft.minParticipants !== null &&
            draft.minParticipants > capacity
          )
            touch("minParticipants");
        }}
        onBlur={() => touch("capacity")}
        error={err("capacity")}
        hint={`بین ${toFaDigits(LIMITS.capacityMin)} تا ${toFaDigits(LIMITS.capacityMax)} نفر`}
      />
      <TextField
        label="حد نصاب برای قطعی شدن (نفر)"
        inputMode="numeric"
        required
        value={
          draft.minParticipants === null
            ? ""
            : toFaDigits(draft.minParticipants)
        }
        onChange={(e) => {
          set({ minParticipants: parseCount(e.target.value) });
          touch("minParticipants");
        }}
        onBlur={() => touch("minParticipants")}
        error={err("minParticipants")}
        hint={minParticipantsHint}
      />
      <TextField
        label="بودجه هر نفر (تومان)"
        inputMode="numeric"
        required
        value={draft.priceToman === null ? "" : formatNumber(draft.priceToman)}
        onChange={(e) => set({ priceToman: parseCount(e.target.value) })}
        onBlur={() => touch("priceToman")}
        error={err("priceToman")}
        hint={
          draft.priceToman
            ? `حدود ${formatTomanShort(draft.priceToman)} تومان برای هر نفر`
            : "هزینه تقریبی هر نفر شامل اقامت، غذا و جابه‌جایی"
        }
      />
      <TextField
        label="محل حرکت"
        value={draft.meetingPoint}
        onChange={(e) => set({ meetingPoint: e.target.value })}
        onBlur={() => touch("meetingPoint")}
        error={err("meetingPoint")}
        maxLength={LIMITS.meetingPointMax}
        placeholder="مثلاً: تهران، میدان آزادی"
      />
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line p-4 sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.requiresApproval}
          onChange={(e) => set({ requiresApproval: e.target.checked })}
          className="mt-1 size-4 accent-coral-500"
        />
        <span>
          <span className="block text-sm font-bold">
            تأیید درخواست‌ها توسط من
          </span>
          <span className="mt-1 block text-xs leading-6 text-ink-muted">
            اگر خاموش باشد، هر درخواست تا تکمیل ظرفیت خودکار پذیرفته می‌شود.
          </span>
        </span>
      </label>
    </div>
  );
}

/* ---------------------------------------------------------------- step 3 */
interface PlanStepProps {
  draft: TourDraft;
  dispatch: (a: Parameters<typeof draftReducer>[1]) => void;
  activeDay: number;
  onDay: (day: number) => void;
  badDays: ReadonlySet<number>;
  err: (key: string) => string | undefined;
  touch: (...keys: string[]) => void;
}

function PlanStep({
  draft,
  dispatch,
  activeDay,
  onDay,
  badDays,
  err,
  touch,
}: PlanStepProps) {
  const total = draft.durationDays ?? 0;
  if (total < 1) {
    return (
      <EmptyState
        icon={<CalendarPlus className="size-7" />}
        title="اول مدت سفر را مشخص کنید"
        text="روزهای برنامه بر اساس مدت سفر ساخته می‌شوند."
      />
    );
  }
  const dayNumbers = Array.from({ length: total }, (_, i) => i + 1);
  const day = dayOf(draft, activeDay);
  const date = dateOfDay(draft, activeDay);
  const key = String(activeDay);
  const addItem = () => dispatch({ type: "addItem", day: activeDay });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-black">برنامه روز به روز</h2>
          <p className="mt-1 text-xs text-ink-muted">
            برای هر روز اقامت، رستوران، جاذبه، فعالیت یا جابه‌جایی اضافه کنید.
            روزی بدون فعالیت هم مجاز است.
          </p>
        </div>
      </div>
      <DayTabs
        idPrefix="planner"
        label="روزهای سفر"
        activeKey={key}
        onChange={(k) => onDay(Number(k))}
        days={dayNumbers.map((n) => ({
          key: String(n),
          dayNumber: n,
          date: dateOfDay(draft, n),
          count: dayOf(draft, n).items.length,
          invalid: badDays.has(n),
        }))}
      />

      <section
        role="tabpanel"
        id={dayPanelId("planner", key)}
        aria-labelledby={dayTabId("planner", key)}
        key={key}
        className="mt-4 animate-fade-up rounded-2xl border border-line bg-surface-muted/60 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-forest-800 px-3 py-1.5 text-xs font-black text-white dark:bg-forest-500">
            روز {toFaDigits(activeDay)}
            {date && (
              <span className="ms-1 font-medium text-white/80">
                · {formatWeekday(date)} {formatDate(date, false)}
              </span>
            )}
          </span>
          <input
            value={day.title}
            onChange={(e) =>
              dispatch({
                type: "dayTitle",
                day: activeDay,
                title: e.target.value,
              })
            }
            onBlur={() => touch(dayErrorKey(activeDay))}
            placeholder="عنوان روز (مثلاً: حرکت و برپایی کمپ)"
            aria-label={`عنوان روز ${toFaDigits(activeDay)}`}
            aria-invalid={err(dayErrorKey(activeDay)) ? true : undefined}
            maxLength={LIMITS.dayTitleMax}
            className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
          />
        </div>

        {day.items.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-4 py-8 text-center">
            <CalendarPlus className="size-8 text-brand" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold">
              هنوز فعالیتی برای این روز اضافه نشده
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              می‌توانید خالی بگذارید (روز آزاد) یا اولین مورد را اضافه کنید.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="mt-4"
              icon={<Plus className="size-4" />}
              onClick={addItem}
            >
              افزودن فعالیت
            </Button>
          </div>
        ) : (
          <>
            <ul
              className="mt-4 space-y-3"
              aria-label={`فعالیت‌های روز ${toFaDigits(activeDay)}`}
            >
              {day.items.map((it, idx) => {
                const titleErr = err(itemErrorKey(it.key, "title"));
                const timeErr = err(itemErrorKey(it.key, "startTime"));
                return (
                  <li
                    key={it.key}
                    className="rounded-2xl border border-line bg-surface p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-[8rem_1fr_6.5rem]">
                      <select
                        value={it.type}
                        onChange={(e) =>
                          dispatch({
                            type: "updateItem",
                            day: activeDay,
                            key: it.key,
                            patch: {
                              type: itemTypeSchema.parse(e.target.value),
                            },
                          })
                        }
                        aria-label="نوع فعالیت"
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
                        onChange={(e) =>
                          dispatch({
                            type: "updateItem",
                            day: activeDay,
                            key: it.key,
                            patch: { title: e.target.value },
                          })
                        }
                        onBlur={() => touch(itemErrorKey(it.key, "title"))}
                        placeholder="عنوان (اقامتگاه، رستوران، جاذبه...)"
                        aria-label="عنوان فعالیت"
                        maxLength={LIMITS.itemTitleMax}
                        aria-invalid={titleErr ? true : undefined}
                        className={cn(
                          "h-10 rounded-xl border bg-surface px-3 text-sm outline-none focus:border-forest-400",
                          titleErr ? "border-danger" : "border-line",
                        )}
                      />
                      <input
                        type="time"
                        value={it.startTime}
                        onChange={(e) =>
                          dispatch({
                            type: "updateItem",
                            day: activeDay,
                            key: it.key,
                            patch: { startTime: e.target.value },
                          })
                        }
                        aria-label="ساعت"
                        aria-invalid={timeErr ? true : undefined}
                        dir="ltr"
                        className={cn(
                          "h-10 rounded-xl border bg-surface px-2 text-sm",
                          timeErr ? "border-danger" : "border-line",
                        )}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        value={it.location}
                        onChange={(e) =>
                          dispatch({
                            type: "updateItem",
                            day: activeDay,
                            key: it.key,
                            patch: { location: e.target.value },
                          })
                        }
                        placeholder="مکان (اختیاری)"
                        aria-label="مکان"
                        maxLength={LIMITS.itemLocationMax}
                        className="h-9 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-xs outline-none focus:border-forest-400"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "moveItem",
                            day: activeDay,
                            key: it.key,
                            dir: -1,
                          })
                        }
                        disabled={idx === 0}
                        aria-label="انتقال به بالا"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "moveItem",
                            day: activeDay,
                            key: it.key,
                            dir: 1,
                          })
                        }
                        disabled={idx === day.items.length - 1}
                        aria-label="انتقال به پایین"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted disabled:opacity-30"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "removeItem",
                            day: activeDay,
                            key: it.key,
                          })
                        }
                        aria-label="حذف فعالیت"
                        className="inline-flex size-9 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    {(titleErr ?? timeErr) && (
                      <p role="alert" className="mt-1.5 text-xs text-danger">
                        {titleErr ?? timeErr}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={addItem}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-forest-300 px-4 py-2 text-xs font-bold text-forest-700 transition hover:bg-surface dark:text-forest-200"
            >
              <Plus className="size-4" aria-hidden="true" />
              افزودن فعالیت به روز {toFaDigits(activeDay)}
            </button>
          </>
        )}
        {err(dayErrorKey(activeDay)) && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {err(dayErrorKey(activeDay))}
          </p>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- step 4 */
function ReviewStep({
  draft,
  endDate,
  onEdit,
}: {
  draft: TourDraft;
  endDate: string | null;
  onEdit: (step: number) => void;
}) {
  const total = draft.durationDays ?? 0;
  const rows: [string, string][] = [
    [
      "تاریخ",
      draft.startDate && endDate
        ? `${formatDate(draft.startDate, false)} تا ${formatDate(endDate)}`
        : "—",
    ],
    ["مدت", `${toFaDigits(total)} روز`],
    ["سختی", draft.difficulty ? DIFFICULTY_LABELS[draft.difficulty] : "—"],
    [
      "ظرفیت",
      draft.capacity !== null ? `${toFaDigits(draft.capacity)} نفر` : "—",
    ],
    [
      "حد نصاب",
      draft.minParticipants !== null
        ? `${toFaDigits(draft.minParticipants)} نفر`
        : "—",
    ],
    [
      "بودجه هر نفر",
      draft.priceToman !== null ? formatToman(draft.priceToman) : "—",
    ],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{draft.title}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {draft.destination}، {draft.province} ·{" "}
            {draft.categories.map((c) => CATEGORY_LABELS[c]).join("، ")}
          </p>
        </div>
        <Badge tone={STATUS_META.draft.tone}>{STATUS_META.draft.label}</Badge>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-surface-muted p-4">
            <dt className="text-xs text-ink-soft">{k}</dt>
            <dd className="mt-1 text-sm font-black">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 whitespace-pre-line text-sm leading-8 text-ink-muted">
        {draft.description}
      </p>
      <div className="mt-6 flex items-center justify-between">
        <h3 className="text-sm font-black">برنامه روزانه</h3>
        <button
          type="button"
          onClick={() => onEdit(2)}
          className="text-xs font-bold text-coral-500 hover:text-coral-600"
        >
          ویرایش برنامه
        </button>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const d = dayOf(draft, n);
          const date = dateOfDay(draft, n);
          return (
            <li key={n} className="rounded-xl bg-surface-muted px-4 py-3">
              <span className="font-bold">
                روز {toFaDigits(n)}
                {d.title.trim() ? `: ${d.title.trim()}` : ""}
              </span>
              {date && (
                <span className="ms-2 text-xs text-ink-soft">
                  {formatWeekday(date)} {formatDate(date, false)}
                </span>
              )}
              <span className="mt-1 block text-xs text-ink-muted">
                {d.items.length
                  ? d.items.map((x) => x.title.trim()).join("، ")
                  : "بدون فعالیت (روز آزاد)"}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 rounded-2xl bg-tint-butter p-4 text-xs leading-6 text-ink-muted">
        پس از ارسال، تور در وضعیت «در انتظار بررسی» قرار می‌گیرد و تا تأیید مدیر
        در جست‌وجو نمایش داده نمی‌شود. اگر هنوز آماده نیست، «ذخیره پیش‌نویس» را
        بزنید تا بعداً از «تورهای من» ادامه دهید.
      </p>
    </div>
  );
}
