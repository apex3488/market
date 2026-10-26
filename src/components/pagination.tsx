import { Link } from "@/i18n/navigation";

export function Pagination({
  page,
  pageCount,
  makeHref,
  labels,
}: {
  page: number;
  pageCount: number;
  makeHref: (page: number) => string;
  labels: { prev: string; next: string; page: string };
}) {
  if (pageCount <= 1) return null;
  return (
    <nav className="flex flex-wrap items-center gap-3" aria-label={labels.page}>
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="btn btn-ghost">
          {labels.prev}
        </Link>
      ) : null}
      <p className="text-sm text-muted">
        {page} / {pageCount}
      </p>
      {page < pageCount ? (
        <Link href={makeHref(page + 1)} className="btn btn-ghost">
          {labels.next}
        </Link>
      ) : null}
    </nav>
  );
}
