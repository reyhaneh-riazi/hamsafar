import { useMemo, useState } from "react";
import { Heart, NotebookPen, Tag, Users } from "lucide-react";
import { Link } from "react-router";
import { useSession } from "@/features/auth/hooks";
import { TourCard, TourCardSkeletonGrid } from "@/features/tours/ui/TourCard";
import { useSimilarTravelers } from "@/features/users/hooks";
import { errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDate } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { TextArea, TextField } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState, ErrorState } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import type { FavoriteEntry } from "../api/favorite-schemas";
import { useFavorites, useUpdateFavorite } from "../hooks";
import { FavoriteButton } from "./FavoriteButton";

/** Favourites (FS 13): visible list, expired/cancelled badges, labels, notes, public list, similar travellers. */
export function FavoritesPage() {
  useDocumentTitle("علاقه‌مندی‌ها");
  const { user } = useSession();
  const { data, isPending, isError, refetch } = useFavorites();
  const [label, setLabel] = useState<string | null>(null);
  const [editing, setEditing] = useState<FavoriteEntry | null>(null);
  const labels = useMemo(
    () => [
      ...new Set(
        (data ?? []).map((f) => f.label).filter((l): l is string => !!l),
      ),
    ],
    [data],
  );
  const shown = (data ?? []).filter((f) => !label || f.label === label);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="pb-12">
      <PageHeader
        title="علاقه‌مندی‌ها"
        subtitle={
          data
            ? `${toFaDigits(data.length)} تور ذخیره شده — برچسب بزن، یادداشت بنویس و اگر خواستی فهرستت را عمومی کن.`
            : "تورهایی که برای بعد نگه داشته‌ای."
        }
        crumbs={[{ label: "خانه", to: "/" }, { label: "علاقه‌مندی‌ها" }]}
        actions={
          user && (
            <ButtonLink to="/profile?tab=settings" variant="light" size="sm">
              {user.favoritesPublic
                ? "فهرست شما عمومی است"
                : "عمومی کردن فهرست"}
            </ButtonLink>
          )
        }
      />
      <div className="relative z-[1] mx-auto -mt-8 grid max-w-page gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-9">
          {labels.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-line bg-surface p-3 shadow-card">
              <Chip selected={label === null} onClick={() => setLabel(null)}>
                همه
              </Chip>
              {labels.map((l) => (
                <Chip
                  key={l}
                  selected={label === l}
                  onClick={() => setLabel(l)}
                >
                  <Tag className="size-3.5" aria-hidden="true" />
                  {l}
                </Chip>
              ))}
            </div>
          )}
          {isError && (
            <ErrorState
              text="دریافت علاقه‌مندی‌ها ممکن نشد."
              onRetry={() => void refetch()}
            />
          )}
          {data?.length === 0 && (
            <EmptyState
              className="bg-surface"
              icon={<Heart className="size-7" />}
              title="هنوز توری را نشان نکرده‌ای"
              text="روی قلب هر تور بزن تا اینجا ذخیره شود."
              action={<ButtonLink to="/tours">گشتن در تورها</ButtonLink>}
            />
          )}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {isPending && <TourCardSkeletonGrid count={3} />}
            {shown.map((f, i) => {
              const expired =
                f.tour.status === "cancelled" ||
                f.tour.status === "completed" ||
                f.tour.startDate < today;
              return (
                <div
                  key={f.tour.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <TourCard
                    tour={f.tour}
                    action={<FavoriteButton tour={f.tour} />}
                    className="h-full"
                    footnote={
                      <div className="relative z-[1] mt-2 space-y-1.5">
                        {expired && (
                          <p className="text-[11px] font-bold text-danger">
                            منقضی شده
                          </p>
                        )}
                        {f.label && (
                          <p className="text-[11px] font-bold text-forest-700 dark:text-forest-200">
                            #{f.label}
                          </p>
                        )}
                        {f.note && (
                          <p className="line-clamp-2 rounded-lg bg-tint-butter px-2 py-1 text-[11px] leading-5 text-ink-muted">
                            {f.note}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-ink-soft">
                            ذخیره در {formatDate(f.addedAt.slice(0, 10))}
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditing(f)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-coral-500 hover:text-coral-600"
                          >
                            <NotebookPen
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            برچسب و یادداشت
                          </button>
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
        <SimilarTravelers />
      </div>
      {editing && (
        <EditFavoriteModal
          entry={editing}
          labels={labels}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function SimilarTravelers() {
  const { data } = useSimilarTravelers();
  return (
    <aside
      className="h-fit rounded-panel border border-line bg-surface p-5 shadow-card lg:sticky lg:top-24 lg:col-span-3"
      aria-labelledby="similar-title"
    >
      <h2
        id="similar-title"
        className="flex items-center gap-2 text-sm font-black"
      >
        <Users className="size-4 text-forest-600" aria-hidden="true" />
        همسفرهای هم‌سلیقه
      </h2>
      {!data || data.length === 0 ? (
        <p className="mt-3 text-xs leading-6 text-ink-muted">
          با ذخیره تورهای بیشتر و برچسب‌گذاری، کاربرانی با علاقه‌مندی مشابه (که
          فهرستشان عمومی است) اینجا پیشنهاد می‌شوند.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {data.map((s) => (
            <li key={s.person.id}>
              <Link
                to={`/users/${s.person.id}`}
                className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-muted"
              >
                <Avatar name={s.person.displayName} src={s.person.avatarUrl} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">
                    {s.person.displayName}
                  </span>
                  <span className="block text-[11px] text-ink-muted">
                    {toFaDigits(s.sharedTours)} تور مشترک
                    {s.sharedLabels.length
                      ? ` · ${s.sharedLabels.join("، ")}`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function EditFavoriteModal({
  entry,
  labels,
  onClose,
}: {
  entry: FavoriteEntry;
  labels: string[];
  onClose: () => void;
}) {
  const update = useUpdateFavorite();
  const toast = useToast();
  const [label, setLabel] = useState(entry.label ?? "");
  const [note, setNote] = useState(entry.note ?? "");
  return (
    <Modal
      open
      onClose={onClose}
      title={entry.tour.title}
      description="برچسب برای دسته‌بندی و یادداشت شخصی برای این تور."
      dismissible={!update.isPending}
    >
      <TextField
        label="برچسب"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        maxLength={30}
        placeholder="مثلاً سفرهای پاییزی"
        data-autofocus
      />
      {labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {labels.map((l) => (
            <Chip
              key={l}
              selected={label === l}
              onClick={() => setLabel(l)}
              className="h-7 px-2.5 text-[11px]"
            >
              {l}
            </Chip>
          ))}
        </div>
      )}
      <div className="mt-4">
        <TextArea
          label="یادداشت"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={300}
        />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={update.isPending}>
          انصراف
        </Button>
        <Button
          loading={update.isPending}
          onClick={() =>
            update.mutate(
              {
                tourId: entry.tour.id,
                label: label.trim() || null,
                note: note.trim() || null,
              },
              {
                onSuccess: () => {
                  toast.success("ذخیره شد.");
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
