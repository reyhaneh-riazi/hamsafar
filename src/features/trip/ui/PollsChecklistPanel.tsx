import { useEffect, useState, type FormEvent } from "react";
import {
  SquareCheckBig,
  Lock,
  Plus,
  Square,
  Trash2,
  Trophy,
  Vote,
  X,
} from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import type { Poll } from "../api/trip-schemas";
import {
  useChecklist,
  useCreatePoll,
  usePolls,
  useSaveChecklist,
  useToggleChecklist,
  useVote,
} from "../hooks";

/** Polls with deadline + readiness checklist (FS 11). Only the leader creates/edits; members vote and tick. */
export function PollsChecklistPanel({ tourId }: { tourId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PollsSection tourId={tourId} />
      <ChecklistSection tourId={tourId} />
    </div>
  );
}

function PollsSection({ tourId }: { tourId: string }) {
  const { data, isPending, isError, refetch } = usePolls(tourId);
  const [creating, setCreating] = useState(false);
  return (
    <section
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="polls-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="polls-title"
          className="flex items-center gap-2 text-base font-black"
        >
          <Vote className="size-5 text-coral-500" aria-hidden="true" />
          رأی‌گیری‌ها
        </h2>
        {data?.canCreate && (
          <Button
            size="sm"
            icon={<Plus className="size-4" />}
            onClick={() => setCreating(true)}
          >
            رأی‌گیری جدید
          </Button>
        )}
      </div>
      <div className="mt-4 space-y-4">
        {isPending && <Skeleton className="h-40" />}
        {isError && (
          <ErrorState
            text="دریافت رأی‌گیری‌ها ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data?.items.length === 0 && (
          <p className="text-sm text-ink-muted">رأی‌گیری فعالی وجود ندارد.</p>
        )}
        {data?.items.map((p) => (
          <PollCard
            key={p.id}
            tourId={tourId}
            poll={p}
            canVote={data.canVote}
          />
        ))}
      </div>
      {data?.canCreate && (
        <CreatePollModal
          tourId={tourId}
          open={creating}
          onClose={() => setCreating(false)}
        />
      )}
    </section>
  );
}

function PollCard({
  tourId,
  poll,
  canVote,
}: {
  tourId: string;
  poll: Poll;
  canVote: boolean;
}) {
  const vote = useVote(tourId);
  const toast = useToast();
  const max = Math.max(1, ...poll.options.map((o) => o.votes ?? 0));
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-black">{poll.question}</p>
        {poll.closed ? (
          <Badge tone="neutral">پایان‌یافته</Badge>
        ) : (
          <Badge tone="amber">تا {formatDateTime(poll.deadline)}</Badge>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {poll.options.map((o) => {
          const mine = poll.myVote === o.id;
          const winner = poll.winnerOptionId === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={poll.closed || !canVote || vote.isPending}
                onClick={() =>
                  vote.mutate(
                    { pollId: poll.id, optionId: o.id },
                    {
                      onError: (e) => toast.error(errorMessage(e)),
                      onSuccess: () => toast.success("رأی شما ثبت شد."),
                    },
                  )
                }
                aria-pressed={mine}
                className={cn(
                  "relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl border px-4 py-2.5 text-start text-sm transition",
                  mine
                    ? "border-coral-400 bg-coral-50 font-bold dark:bg-coral-700/10"
                    : "border-line hover:border-forest-400",
                  "disabled:cursor-default",
                )}
              >
                {o.votes !== null && (
                  <span
                    className="absolute inset-y-0 start-0 bg-forest-100/70 dark:bg-forest-900/50"
                    style={{ width: `${((o.votes ?? 0) / max) * 100}%` }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative flex items-center gap-2">
                  {winner && (
                    <Trophy
                      className="size-4 text-warning"
                      aria-label="گزینه برنده"
                    />
                  )}
                  {o.text}
                </span>
                <span className="relative text-xs text-ink-muted">
                  {o.votes !== null
                    ? `${toFaDigits(o.votes)} رأی`
                    : mine
                      ? "رأی شما"
                      : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-ink-soft">
        {toFaDigits(poll.totalVotes)} رأی ثبت شده ·{" "}
        {poll.closed
          ? "نتیجه نهایی"
          : "تا پایان مهلت می‌توانید رأی خود را تغییر دهید؛ نتیجه بعد از مهلت نمایش داده می‌شود."}
      </p>
    </div>
  );
}

function CreatePollModal({
  tourId,
  open,
  onClose,
}: {
  tourId: string;
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreatePoll(tourId);
  const toast = useToast();
  const tomorrow = new Date(Date.now() + 864e5 * 2).toISOString().slice(0, 16);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [deadline, setDeadline] = useState(tomorrow);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (question.trim().length < 4 || opts.length < 2)
      return setError("سؤال و حداقل دو گزینه لازم است.");
    create.mutate(
      {
        question: question.trim(),
        options: opts,
        deadline: new Date(deadline).toISOString(),
      },
      {
        onSuccess: () => {
          toast.success("رأی‌گیری ساخته شد و به اعضا اطلاع داده شد.");
          setQuestion("");
          setOptions(["", ""]);
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="رأی‌گیری جدید"
      description="مثلاً انتخاب رستوران، جاذبه یا ساعت حرکت."
      dismissible={!create.isPending}
    >
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField
          label="سؤال"
          required
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={120}
          data-autofocus
        />
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-bold">گزینه‌ها</legend>
          {options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={o}
                onChange={(e) =>
                  setOptions((list) =>
                    list.map((x, j) => (j === i ? e.target.value : x)),
                  )
                }
                aria-label={`گزینه ${toFaDigits(i + 1)}`}
                maxLength={60}
                className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  aria-label="حذف گزینه"
                  onClick={() =>
                    setOptions((list) => list.filter((_, j) => j !== i))
                  }
                  className="inline-flex size-11 items-center justify-center rounded-xl text-danger hover:bg-danger/10"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
          {options.length < 6 && (
            <button
              type="button"
              onClick={() => setOptions((l) => [...l, ""])}
              className="inline-flex items-center gap-1 self-start text-xs font-bold text-forest-700 dark:text-forest-200"
            >
              <Plus className="size-4" aria-hidden="true" />
              افزودن گزینه
            </button>
          )}
        </fieldset>
        <TextField
          label="مهلت رأی‌گیری"
          type="datetime-local"
          required
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          dir="ltr"
        />
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            انصراف
          </Button>
          <Button type="submit" loading={create.isPending}>
            ساخت رأی‌گیری
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChecklistSection({ tourId }: { tourId: string }) {
  const { data, isPending, isError, refetch } = useChecklist(tourId);
  const toggle = useToggleChecklist(tourId);
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const done = data?.items.filter((i) => i.done).length ?? 0;
  const total = data?.items.length ?? 0;

  return (
    <section
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="check-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="check-title"
          className="flex items-center gap-2 text-base font-black"
        >
          <SquareCheckBig
            className="size-5 text-forest-600"
            aria-hidden="true"
          />
          چک‌لیست آمادگی
        </h2>
        {data?.canEdit ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            ویرایش فهرست
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
            <Lock className="size-3.5" aria-hidden="true" />
            فهرست را تورلیدر تعیین می‌کند
          </span>
        )}
      </div>
      {total > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>آمادگی شما</span>
            <span>
              {toFaDigits(done)} از {toFaDigits(total)}
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-forest-500 transition-all duration-500"
              style={{ width: `${(done / total) * 100}%` }}
            />
          </div>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {isPending && <Skeleton className="h-32" />}
        {isError && (
          <ErrorState
            text="دریافت چک‌لیست ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data?.items.length === 0 && (
          <li className="text-sm text-ink-muted">موردی تعریف نشده است.</li>
        )}
        {data?.items.map((i) => (
          <li key={i.id}>
            <button
              type="button"
              onClick={() =>
                toggle.mutate(i.id, {
                  onError: (e) => toast.error(errorMessage(e)),
                })
              }
              aria-pressed={i.done}
              className="flex w-full items-center gap-3 rounded-xl border border-line px-4 py-3 text-start text-sm transition hover:border-forest-400"
            >
              {i.done ? (
                <SquareCheckBig
                  className="size-5 text-forest-600"
                  aria-hidden="true"
                />
              ) : (
                <Square className="size-5 text-ink-soft" aria-hidden="true" />
              )}
              <span
                className={cn(
                  "flex-1",
                  i.done && "text-ink-muted line-through",
                )}
              >
                {i.title}
              </span>
              {i.required && <Badge tone="coral">ضروری</Badge>}
              <span className="text-[10px] text-ink-soft">
                {toFaDigits(i.doneCount)}/{toFaDigits(data.memberCount)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {data?.canEdit && (
        <ChecklistEditor
          tourId={tourId}
          open={editing}
          onClose={() => setEditing(false)}
          initial={data.items}
        />
      )}
    </section>
  );
}

function ChecklistEditor({
  tourId,
  open,
  onClose,
  initial,
}: {
  tourId: string;
  open: boolean;
  onClose: () => void;
  initial: { id: string; title: string; required: boolean }[];
}) {
  const save = useSaveChecklist(tourId);
  const toast = useToast();
  const [items, setItems] = useState(initial);
  const [title, setTitle] = useState("");
  useEffect(() => {
    if (open) setItems(initial);
  }, [open, initial]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ویرایش چک‌لیست"
      description="وسایل، مدارک و کارهای لازم برای این سفر."
      dismissible={!save.isPending}
    >
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li
            key={it.id}
            className="flex items-center gap-2 rounded-xl border border-line px-3 py-2"
          >
            <span className="flex-1 text-sm">{it.title}</span>
            <label className="flex items-center gap-1 text-xs text-ink-muted">
              <input
                type="checkbox"
                checked={it.required}
                onChange={(e) =>
                  setItems((l) =>
                    l.map((x, j) =>
                      j === idx ? { ...x, required: e.target.checked } : x,
                    ),
                  )
                }
                className="accent-coral-500"
              />
              ضروری
            </label>
            <button
              type="button"
              aria-label={`حذف ${it.title}`}
              onClick={() => setItems((l) => l.filter((_, j) => j !== idx))}
              className="inline-flex size-8 items-center justify-center rounded-lg text-danger hover:bg-danger/10"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim().length < 2) return;
          setItems((l) => [
            ...l,
            { id: `new-${Date.now()}`, title: title.trim(), required: false },
          ]);
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مورد جدید (مثلاً کیسه‌خواب)"
          aria-label="مورد جدید"
          maxLength={80}
          className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
        />
        <Button
          type="submit"
          variant="outline"
          icon={<Plus className="size-4" />}
        >
          افزودن
        </Button>
      </form>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={save.isPending}>
          انصراف
        </Button>
        <Button
          loading={save.isPending}
          onClick={() =>
            save.mutate(
              items.map((i) => ({
                id: i.id.startsWith("new-") ? undefined : i.id,
                title: i.title,
                required: i.required,
              })),
              {
                onSuccess: () => {
                  toast.success("چک‌لیست ذخیره شد.");
                  onClose();
                },
                onError: (e) => toast.error(errorMessage(e)),
              },
            )
          }
        >
          ذخیره
        </Button>
      </div>
    </Modal>
  );
}
